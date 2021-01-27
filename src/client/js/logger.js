import Log from 'log';
import dom from 'dom';

const log = new Log({ defaultVerbosity: parseInt(dom.storage.get('logVerbosity') || 0) });