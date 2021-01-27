const log = new (require('log'))({ tag: 'phaserload' });

process.on('exit', function(code){ log.error('EXIT', code); });

process.on('SIGINT', () => {
	log.warn('Exiting via Ctrl + C');

	process.exit(130);
});

process.on('uncaughtException', (err) => {
	log.error('Uncaught Exception', err.stack);

	process.exit(99);
});