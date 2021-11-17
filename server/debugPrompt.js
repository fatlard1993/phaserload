const { Log } = require('log');
const log = new Log({ tag: 'phaserload' });

const phaserload = require('./phaserload');

process.openStdin().addListener('data', function (data) {
	data = data.toString().replace(/\n+$/, '');

	log.info(`STDIN: ${data}`);

	if ({ stop: 1, close: 1, exit: 1 }[data]) process.kill(process.pid, 'SIGTERM');
	else {
		const cmd = data.split(' ');

		if (cmd[0] === 'set') {
			if (phaserload.socketServer.rooms[cmd[1]] && phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]] && phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]][cmd[3]]) {
				let success = false;

				if (phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]][cmd[3]][cmd[4]]) {
					success = true;

					phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]][cmd[3]][cmd[4]] = cmd[5];
				} else if (phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]][cmd[3]]) {
					success = true;

					phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]][cmd[3]] = cmd[4];
				}

				if (success) {
					log('Successfully set', cmd);

					phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]].updateFuel();
					phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]].updateCargoBay();
					phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]].updateHealth();

					phaserload.socketServer.users[cmd[2]].reply('player_state', phaserload.socketServer.rooms[cmd[1]].state.players[cmd[2]]);
				}
			}
		}
	}
});
