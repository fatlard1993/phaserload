const log = new (require('log'))({ tag: 'phaserload' });

const phaserload = require('./phaserload');

process.openStdin().addListener('data', function(data){
	data = data.toString().replace(/\n+$/, '');

	log.info(`STDIN: ${data}`);

	if({ stop: 1, close: 1, exit: 1 }[data]) process.kill(process.pid, 'SIGTERM');
});