#!/usr/bin/env node

const { Log } = require('log');
const argi = require('argi');

const { options } = argi.parse({
	port: {
		type: 'number',
		defaultValue: 1040,
		alias: 'p',
	},
	verbosity: {
		type: 'number',
		defaultValue: 1,
		alias: 'v',
	},
});

const log = new Log({ tag: 'phaserload', defaults: { verbosity: options.verbosity, color: true } });

log(1)('Options', options);

require('./phaserload').init(options);

require('./exit');
