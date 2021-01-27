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
			moveSpeed: game.state.world.moveSpeed,
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

		y = phaserload.checkMobFall({ x, y }, this.state.world.map); //todo hurt mob based on fall distance

		if(this.state.world.map[x][y].ground.type){
			const { type, mineral } = this.state.world.map[x][y].ground;

			if(!this.state.players[name].inventory[`trace_${type}`]) this.state.players[name].inventory[`trace_${type}`] = 1;
			else ++this.state.players[name].inventory[`trace_${type}`];

			if(mineral){
				if(!this.state.players[name].inventory[`pure_${type}`]) this.state.players[name].inventory[`pure_${type}`] = 1;
				else ++this.state.players[name].inventory[`pure_${type}`];
			}

			//todo consume hull space (based on density)

			this.state.world.map[x][y].ground = {};
		}

		//todo account for dig speed and material density when digging

		//todo if this move causes another player to lose footing make them fall

		//todo use gas

		log(`Player move from ${oldPos.x} ${oldPos.y} to ${x} ${y}`);

		this.state.players[name].position = { x, y };

		this.broadcastState();
	}
}

module.exports = SocketGame;