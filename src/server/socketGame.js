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
				fuel_tank: 'standard:~:tritanium'
			},
			inventory: { teleporter: 1 },
			credits: 0,
			health: 100,
			fuel: 5,
			hull: 100,
			moveSpeed: game.state.world.moveSpeed,// change world setting to "gravity"
			getMoveSpeed: function(){
				let speed = game.state.world.moveSpeed;

				// todo account for: tracks, hull size, material weight

				this.moveSpeed = speed;
			}
		}, phaserload.modes[this.options.mode].player || {}, this.state.players[client.name]);

		if(!player.position) player.position = { x: util.randInt(1, this.state.world.width - 1), y: this.state.world.airGap };

		this.state.players[player.name] = player;
		this.state.playerNames = this.clientNames;

		log()(`Player "${player.name}" joined gameRoom "${this.name}" | Current players: ${this.state.playerNames}`);

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
		this.broadcast('state', this.state);
	}

	playerMove({ name, x, y }){
		const oldPos = this.state.players[name].position;

		if(x < 0 || y < 0 || (oldPos.x === x && oldPos.y === y)) return;

		if(!this.dig({ x, y }, this.state.players[name])) y = phaserload.checkMobFall(this.state.world.map, { x, y }); //todo hurt mob based on fall distance

		//todo account for dig speed and material density when digging

		this.state.players[name].fuel -= 0.1;//todo use more or less gas based on dig speed

		log(`Player move from ${oldPos.x} ${oldPos.y} to ${x} ${y}`);

		this.state.players[name].position = { x, y };

		this.broadcastState();
	}

	dig({ x, y }, player){
		if(!this.state.world.map[x][y].ground.type) return false;

		if(player){
			const { type, mineral } = this.state.world.map[x][y].ground;

			if(!player.inventory[`trace_${type}`]) player.inventory[`trace_${type}`] = 1;
			else ++player.inventory[`trace_${type}`];

			if(mineral){
				if(!player.inventory[`pure_${type}`]) player.inventory[`pure_${type}`] = 1;
				else ++player.inventory[`pure_${type}`];
			}

			//todo consume hull space (based on density)
		}

		this.state.world.map[x][y].ground = {};

		//todo touching grounds have a chance to fall based on density

		//todo if this move causes another player to lose footing make them fall

		if(phaserload.spacecoAt(this.state.world.spaceco, { x, y: y - 1 })){
			const spacecoFallY = phaserload.checkMobFall(this.state.world.map, this.state.world.spaceco.position);

			log('Check spaceco fall', this.state.world.spaceco.position.y - spacecoFallY);

			if(spacecoFallY) this.state.world.spaceco.position.y = spacecoFallY;
		}

		return true;
	}
}

module.exports = SocketGame;