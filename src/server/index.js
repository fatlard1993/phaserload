#!/usr/bin/env node

const rootFolder = require('find-root')(__dirname);
const argi = require('argi').parse({
	port: {
		type: 'int',
		defaultValue: 80,
		alias: 'p'
	},
	rootFolder: {
		type: 'string',
		defaultValue: rootFolder
	},
	verbosity: {
		type: 'number',
		defaultValue: 1,
		alias: 'v'
	}
});

const options = argi.options.named;

const log = new (require('log'))({ tag: 'phaserload', defaults: { verbosity: options.verbosity, color: true } });

log(1)('Options', options);

require('./phaserload').init(options);

require('./exit');