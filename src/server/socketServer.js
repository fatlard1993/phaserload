const log = new (require('log'))({ tag: 'sockets' });
const WebsocketServer = require('websocket-server');

const phaserload = require('./phaserload');
const SocketLobby = require('./socketLobby');
const SocketGame = require('./socketGame');

class SocketServer extends WebsocketServer {
	constructor(httpServer){
		super({ server: httpServer });

		const server = this;

		server.rooms = { lobby: new SocketLobby(server) };
		server.users = {};

		server.registerEndpoints({
			client_connect: function(){
				log('client_connect');

				this.reply('init', phaserload.options);
			},
			room_check: function(room){
				log('room_check', room);

				if(!server.rooms[room]) this.reply('redirect', '/lobby');
			},
			client_join: function({ name, room }){
				log('client_join');

				if(!server.rooms[room]) return this.reply('redirect', '/lobby');

				server.rooms[room].addClient(this, name);
			},
			create_game: function(options){
				log('create_game');

				server.rooms[options.name] = new SocketGame(options, server);

				server.rooms.lobby.broadcastState();
			},
			client_disconnect: function(){
				log('client_disconnect');

				if(this.roomName && server.rooms[this.roomName]) server.rooms[this.roomName].removeClient(this);
			},
			player_move: function(data){
				server.rooms[this.roomName].playerMove(data);
			},
			console_connect: function(){
				const { position, cargoBay, fuel, health } = server.rooms[this.roomName].state.players[this.name];
				let type;

				if(phaserload.spacecoAt(server.rooms[this.roomName].state.world.spaceco, position)){
					type = 'spaceco';

					log('spaceco trade', cargoBay, server.rooms[this.roomName].state.players[this.name]);

					//todo allow player to sell cargo individually
					Object.keys(cargoBay.material).forEach((mineral) => {
						server.rooms[this.roomName].state.players[this.name].credits += phaserload.getMineralPrice(mineral, server.rooms[this.roomName].state.world) * cargoBay.material[mineral];
					});

					server.rooms[this.roomName].state.players[this.name].cargoBay.material = {};
					server.rooms[this.roomName].state.players[this.name].updateCargoBay();

					//todo allow players to buy as fuel at-will
					server.rooms[this.roomName].state.players[this.name].credits -= (100 - fuel.available) * 10;
					server.rooms[this.roomName].state.players[this.name].fuel.available = 100;
					server.rooms[this.roomName].state.players[this.name].updateFuel();

					//todo allow players to purchase repairs at-will
					server.rooms[this.roomName].state.players[this.name].credits -= (100 - health.available) * 10;
					server.rooms[this.roomName].state.players[this.name].health.available = 100;
					server.rooms[this.roomName].state.players[this.name].updateHealth();

					server.users[this.name].reply('player_state', server.rooms[this.roomName].state.players[this.name]);
				}

				else type = 'inventory';

				this.reply('console_connect', type);
			}
		});
	}
}

module.exports = SocketServer;