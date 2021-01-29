const log = new (require('log'))({ tag: 'phaserload' });

const phaserload = require('./phaserload');

process.openStdin().addListener('data', function(data){
	data = data.toString().replace(/\n+$/, '');

	log.info(`STDIN: ${data}`);

	if(data === 'stop') process.kill(process.pid, 'SIGTERM');
});