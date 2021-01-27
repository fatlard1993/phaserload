const log = new (require('log'))({ tag: 'sockets' });
const WebsocketServer = require('websocket-server');

class SocketRoom {
	constructor(name, server){
		this.name = name;
		this.server = server;
		this.clientNames = [];

		log(`Create socket room "${name}"`);
	}

	addClient(client, name = Math.random().toString()){
		log(`User "${name}" join room "${this.name}"`);

		client.name = name;
		client.roomName = this.name;

		this.server.users[name] = client;

		this.clientNames = Object.keys(this.server.users);
	}

	removeClient(client){
		log(`User "${client.name}" leave room "${this.name}"`);

		delete this.server.users[client.name];

		this.clientNames = Object.keys(this.server.users);

		if(!this.clientNames.length) delete this.server.rooms[this.name];
	}

	broadcast(type, payload){
		var message = JSON.stringify({ type, payload });

		this.clientNames.forEach((clientName) => {
			if(this.server.users[clientName] && this.server.users[clientName].readyState === WebsocketServer.OPEN) this.server.users[clientName].send(message);
		});
	}
}

module.exports = SocketRoom;