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
				const playerPosition = server.rooms[this.roomName].state.players[this.name].position;
				let type;

				if(phaserload.spacecoAt(server.rooms[this.roomName].state.world.spaceco, playerPosition)) type = 'spaceco';

				else type = 'inventory';

				this.reply('console_connect', type);
			}
		});
	}


}

module.exports = SocketServer;