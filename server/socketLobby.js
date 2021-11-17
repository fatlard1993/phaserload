const { Log } = require('log');
const SocketRoom = require('./socketRoom');

const log = new Log({ tag: 'sockets' });

class SocketLobby extends SocketRoom {
	constructor(server) {
		super('lobby', server);

		this.state = [];

		log('Create socket lobby room');
	}

	addClient(client, name) {
		super.addClient(client, name);

		this.broadcastState();
	}

	removeClient(client) {
		log(`Player "${client.name}" is leaving the lobby`);

		delete this.server.users[client.name];

		this.clientNames = Object.keys(this.server.users);
	}

	broadcastState() {
		const server = this.server;

		this.state = Object.keys(server.rooms).reduce((result, name) => {
			if (name !== 'lobby') result.push({ name, players: server.rooms[name].clientNames.length });

			return result;
		}, []);

		this.broadcast('state', this.state);
	}
}

module.exports = SocketLobby;
