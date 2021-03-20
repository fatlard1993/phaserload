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
				cargoBay: 'standard:~:tritanium',
				drill: 'standard:~:tritanium',
				fuelTank: 'standard:~:tritanium'
			},
			orientation: 'right',
			inventory: { teleporter: 1 },
			moveTime: 0,
			credits: [0, 9],
			health: {},
			fuel: {},
			cargoBay: {
				material: {}
			},
			updateHealth: function(hurt = 0){
				const tracksPart = this.configuration.tracks.split(':~:');
				const hullPart = this.configuration.hull.split(':~:');
				const cargoBayPart = this.configuration.cargoBay.split(':~:');
				const drillPart = this.configuration.drill.split(':~:');
				const fuelTankPart = this.configuration.fuelTank.split(':~:');
				let maxHealth = 0;

				//todo base the health on the part types and material
				maxHealth += { standard: 0.5 }[tracksPart[0]];
				maxHealth += { standard: 2 }[hullPart[0]];
				maxHealth += { standard: 1 }[cargoBayPart[0]];
				maxHealth += { standard: 1 }[drillPart[0]];
				maxHealth += { standard: 0.5 }[fuelTankPart[0]];

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
				let fuelConsumption = this.moveTime / 10500;

				if(use) availableFuel -= fuelConsumption;

				availableFuel = (availableFuel / maxFuel) * 100;

				log(1)(`Fuel from ${this.fuel.max} to ${maxFuel} | ${availableFuel}% available`);

				this.fuel.consumption = fuelConsumption;
				this.fuel.max = maxFuel;
				this.fuel.available = availableFuel;
			},
			updateCargoBay: function(){
				const cargoBayPart = this.configuration.cargoBay.split(':~:');
				let maxSpace = { standard: 5, large: 10, oversized: 20 }[cargoBayPart[0]];

				let availableSpace = maxSpace;

				Object.keys(this.cargoBay.material).forEach((mineral) => {
					availableSpace -= phaserload.getMineralConsumption(mineral, game.state.world) * this.cargoBay.material[mineral];
				});

				availableSpace = (availableSpace / maxSpace) * 100;

				log(1)(`Cargo bay .. from ${this.cargoBay.max} to ${maxSpace} | ${availableSpace}% available`);

				this.cargoBay.max = maxSpace;
				this.cargoBay.available = availableSpace;
			},
			updateMoveTime: function(resistance = 0){
				let time = 0;

				time += game.state.world.gravity;
				time += resistance;
				time += ((100 - this.cargoBay.available) / 100) * 300;//todo max cargoBay resistance based on size and material

				// todo account for: track type and configuration materials

				log(1)(`Move time from ${this.moveTime} to ${time}`, game.state.world.gravity, resistance, this.cargoBay.available);

				this.moveTime = time;
			}
		}, phaserload.modes[this.options.mode].player || {}, this.state.players[client.name]);

		if(player.credits instanceof Array) player.credits = util.randInt.apply(null, player.credits);
		if(!player.position) player.position = { x: util.randInt(1, this.state.world.width - 1), y: this.state.world.airGap };

		player.updateHealth();
		player.updateFuel();
		player.updateCargoBay();
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
			const { configuration, inventory, moveTime, credits, health, fuel, cargoBay, position, digging, orientation } = players[name];

			viewState.players[name] = { name, configuration, inventory, moveTime, credits, health, fuel, cargoBay, position, digging, orientation };
		});

		this.broadcast('state', viewState);
	}

	playerMove({ name, x, y }){
		const oldPos = this.state.players[name].position;

		if(this.state.players[name].moving || x < 0 || y < 0 || (oldPos.x === x && oldPos.y === y)) return this.server.users[name].reply('invalid_move', true);

		this.state.players[name].moving = true;

		const groundResistance = this.state.world.densities[this.state.world.map[x][y].ground.type];

		this.state.players[name].updateMoveTime(groundResistance);
		this.state.players[name].updateFuel();

		if(this.state.players[name].fuel.available - this.state.players[name].fuel.consumption <= 0) return this.server.users[name].reply('invalid_move', 'Out of fuel');

		if(!this.dig({ x, y }, this.state.players[name])) y = phaserload.checkMobFall(this.state.world.map, { x, y }); //todo hurt mob based on fall distance

		this.state.players[name].updateCargoBay();

		if(oldPos.x === x && oldPos.y === y){
			this.state.players[name].moving = false;

			return this.server.users[name].reply('invalid_move', true);
		}

		this.state.players[name].updateFuel(true);

		log(1)(`Player move from ${oldPos.x} ${oldPos.y} to ${x} ${y} | MoveTime: ${this.state.players[name].moveTime}`);

		this.state.players[name].position = { x, y };

		let orientation, lastOrientation = this.state.players[name].orientation;

		if(oldPos.x !== x){
			orientation = oldPos.x > x ? 'left' : 'right';
		}
		else if(oldPos.y !== y){
			orientation = oldPos.y > y ? 'up' : 'down';

			if(/up|down/.test(lastOrientation)){
				if(new RegExp(orientation).test(lastOrientation)) orientation = lastOrientation;
				else orientation += `_${/left/.test(lastOrientation) ? 'right' : 'left'}`;
			}
			else orientation += `_${lastOrientation}`;
		}

		this.state.players[name].orientation = orientation;

		const game = this;

		setTimeout(() => { game.state.players[name].moving = false; }, this.state.players[name].moveTime);

		this.broadcastState();
	}

	dig({ x, y }, player){
		if(!this.state.world.map[x][y].ground.type){
			if(player) player.digging = false;

			return false;
		}

		let dig = true;

		if(player){
			const { type, mineral } = this.state.world.map[x][y].ground;

			player.digging = true;

			if(((player.cargoBay.available / 100) * player.cargoBay.max) - phaserload.getMineralConsumption(`trace_${type}`, this.state.world) > 0){
				if(!player.cargoBay.material[`trace_${type}`]) player.cargoBay.material[`trace_${type}`] = 1;
				else ++player.cargoBay.material[`trace_${type}`];

				if(mineral){
					if(!player.cargoBay.material[`pure_${type}`]) player.cargoBay.material[`pure_${type}`] = 1;
					else ++player.cargoBay.material[`pure_${type}`];
				}

				player.updateCargoBay();
			}

			else dig = false;
		}

		if(!dig) return false;

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