import Log from 'log';
import dom from 'dom';

const log = new Log({ defaults: { verbosity: parseInt(dom.storage.get('logVerbosity') || 0) } });

if(typeof module === 'object') module.exports = log;