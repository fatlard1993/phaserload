#!/usr/bin/env node

const argi = require('argi').parse({
	port: {
		type: 'int',
		defaultValue: 80,
		alias: 'p'
	},
	verbosity: {
		type: 'int',
		defaultValue: 1,
		alias: 'v'
	}
});

const options = argi.options.named;

const log = new (require('log'))({ tag: 'phaserload', defaults: { verbosity: options.verbosity, color: true } });

log(1)('Options', options);

require('./phaserload').init(options);

require('./exit');