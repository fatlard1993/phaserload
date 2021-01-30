const log = new (require('log'))({ tag: 'sockets' });
const util = require('js-util');
const SocketRoom = require('./socketRoom');

const phaserload = require('./phaserload');

class SocketGame extends SocketRoom {
	constructor(options, server){
		super(options.name, server);

		this.options = Object.assign({//todo make items and minerals configurable
			items: phaserload.options.items,
			mineralNames: phaserload.options.mineralNames,
			mineralColors: phaserload.options.mineralColors,
			mode: 'default',
			worldPack: 'default',
			startingWorldIndex: 'rand'
		}, options);

		this.state = {
			players: {},
			playerNames: [],
			world: phaserload.generateWorld(options.mode, options.worldPack, options.startingWorldIndex),
		};

		log(`Created socket game room "${options.name}"`);
	}

	addClient(client, name){
		super.addClient(client, name);

		const game = this;

		const player = Object.assign({
			name: client.name,
			configuration: {
				tracks: 'standard:~:tritanium',
				hull: 'standard:~:tritanium',
				drill: 'standard:~:tritanium',
				fuelTank: 'standard:~:tritanium'
			},
			inventory: { teleporter: 1 },
			moveTime: 0,
			credits: 0,
			health: {},
			fuel: {},
			hull: {
				material: {}
			},
			updateHealth: function(hurt = 0){
				const tracksPart = this.configuration.tracks.split(':~:');
				const hullPart = this.configuration.hull.split(':~:');
				const drillPart = this.configuration.drill.split(':~:');
				const fuelTankPart = this.configuration.fuelTank.split(':~:');
				let maxHealth = 5;

				//todo base the health on the part types and material
				// if(tracksPart[1] === 'standard') maxHealth += 5;
				// if(hullPart[1] === 'standard') maxHealth += 5;
				// if(drillPart[1] === 'standard') maxHealth += 5;
				// if(fuelTankPart[1] === 'standard') maxHealth += 5;

				let availableHealth = typeof this.health.available === 'undefined' ? maxHealth : (this.health.available / 100) * this.health.max;

				availableHealth -= hurt;

				availableHealth = (availableHealth / maxHealth) * 100;

				log(1)(`Health from ${this.health.max} to ${maxHealth} | ${availableHealth}% available`);

				this.health.max = maxHealth;
				this.health.available = availableHealth;
			},
			updateFuel: function(use){
				const fuelTankPart = this.configuration.fuelTank.split(':~:');
				const maxFuel = { standard: 5, large: 10, oversized: 15, pressurized: 20, battery: 35, condenser: 45 }[fuelTankPart[0]];
				let availableFuel = typeof this.fuel.available === 'undefined' ? maxFuel : (this.fuel.available / 100) * this.fuel.max;

				if(use) availableFuel -= this.moveTime / 1e5;

				availableFuel = (availableFuel / maxFuel) * 100;

				log(1)(`Fuel from ${this.fuel.max} to ${maxFuel} | ${availableFuel}% available`);

				this.fuel.max = maxFuel;
				this.fuel.available = availableFuel;
			},
			updateHull: function(){
				const hullPart = this.configuration.hull.split(':~:');
				let maxSpace = 0;

				if(hullPart[0] === 'standard') maxSpace = 5;
				if(hullPart[0] === 'large') maxSpace = 10;
				if(hullPart[0] === 'oversized') maxSpace = 20;

				let availableSpace = maxSpace;

				Object.keys(this.hull.material).forEach((item) => {
					item = item.split('_');

					availableSpace -= game.state.world.densities[item[1]] * (item[0] === 'pure' ? 0.00005 : 0.00008);
				});

				availableSpace = (availableSpace / maxSpace) * 100;

				log(1)(`Hull from ${this.hull.max} to ${maxSpace} | ${availableSpace}% available`);

				this.hull.max = maxSpace;
				this.hull.available = availableSpace;
			},
			updateMoveTime: function(resistance = 0){
				let time = 0;

				time += game.state.world.gravity;
				time += resistance;
				time += ((100 - this.hull.available) / 100) * 300;//todo max hull resistance based on size and material

				// todo account for: track type and configuration materials

				log(1)(`Move time from ${this.moveTime} to ${time}`, game.state.world.gravity, resistance, this.hull.available);

				this.moveTime = time;
			}
		}, phaserload.modes[this.options.mode].player || {}, this.state.players[client.name]);

		if(!player.position) player.position = { x: util.randInt(1, this.state.world.width - 1), y: this.state.world.airGap };

		player.updateHealth();
		player.updateFuel();
		player.updateHull();
		player.updateMoveTime();

		this.state.players[name] = player;
		this.state.playerNames = this.clientNames;

		log()(`Player "${name}" joined gameRoom "${this.name}" | Current players: ${this.state.playerNames}`);

		client.reply('options', this.options);
		client.reply('player_state', player);

		this.server.rooms.lobby.broadcastState();
		this.broadcastState();
	}

	removeClient(client){
		log(`Player "${client.name}" is leaving gameRoom "${this.name}"`);

		delete this.server.users[client.name];

		this.clientNames = Object.keys(this.server.users);
	}

	broadcastState(){
		const { world, playerNames, players } = this.state;
		const viewState = {
			world,
			playerNames,
			players: {}
		};

		playerNames.forEach((name) => {
			const { configuration, inventory, moveTime, credits, health, fuel, hull, position } = players[name];

			viewState.players[name] = { name, configuration, inventory, moveTime, credits, health, fuel, hull, position };
		});

		this.broadcast('state', viewState);
	}

	playerMove({ name, x, y }){
		const oldPos = this.state.players[name].position;

		if(this.state.players[name].moving || x < 0 || y < 0 || (oldPos.x === x && oldPos.y === y)) return this.server.users[name].reply('invalid_move', true);

		this.state.players[name].moving = true;

		const groundResistance = this.state.world.densities[this.state.world.map[x][y].ground.type];

		this.state.players[name].updateHull();
		this.state.players[name].updateMoveTime(groundResistance);
		this.state.players[name].updateFuel(true);

		if(!this.dig({ x, y }, this.state.players[name])) y = phaserload.checkMobFall(this.state.world.map, { x, y }); //todo hurt mob based on fall distance

		if(oldPos.x === x && oldPos.y === y){
			this.state.players[name].moving = false;

			return this.server.users[name].reply('invalid_move', true);
		}

		log(1)(`Player move from ${oldPos.x} ${oldPos.y} to ${x} ${y} | MoveTime: ${this.state.players[name].moveTime}`);

		this.state.players[name].position = { x, y };

		const game = this;

		setTimeout(() => { game.state.players[name].moving = false; }, this.state.players[name].moveTime);

		this.broadcastState();
	}

	dig({ x, y }, player){
		if(!this.state.world.map[x][y].ground.type) return false;

		if(player){
			const { type, mineral } = this.state.world.map[x][y].ground;

			if(!player.hull.material[`trace_${type}`]) player.hull.material[`trace_${type}`] = 1;
			else ++player.hull.material[`trace_${type}`];

			if(mineral){
				if(!player.hull.material[`pure_${type}`]) player.hull.material[`pure_${type}`] = 1;
				else ++player.hull.material[`pure_${type}`];
			}

			//todo consume hull space (based on density)
		}

		this.state.world.map[x][y].ground = {};

		//todo touching grounds have a chance to fall based on density

		//todo if this move causes another player to lose footing make them fall

		if(phaserload.spacecoAt(this.state.world.spaceco, { x, y: y - 1 })){
			const spacecoFallY = phaserload.checkMobFall(this.state.world.map, this.state.world.spaceco.position);

			log('Check spaceco fall', spacecoFallY - this.state.world.spaceco.position.y);

			if(spacecoFallY - this.state.world.spaceco.position.y){
				this.state.world.spaceco.position.y = spacecoFallY;

				++this.state.world.spaceco.damage;//todo track health not damage
				//todo hurt is chance based on fall distance

				if(this.state.world.spaceco.damage > 9) this.state.world.spaceco.damage = 9;
			}
		}

		return true;
	}
}

module.exports = SocketGame;