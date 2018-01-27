/* global Dom */

var Log, LogHelp = {
	colorMap: {
		reset: '\x1b[0m',
		info: '\x1b[34m',
		warn: '\x1b[33m',
		error: '\x1b[31m'
	}
};

LogHelp._noop = function _noop(){};

LogHelp._consoleWrap = function _consoleWrap(method){
	return function _log(verbosity){
		if((verbosity || 0) < LogHelp.DBG && console && console[method]){
			if(LogHelp.isNode){
				return function _colorLog(){
					if(LogHelp.mapColors && LogHelp.colorMap[method]){
						Array.prototype.unshift.call(arguments, LogHelp.colorMap[method]);
						Array.prototype.push.call(arguments, LogHelp.colorMap.reset);
					}
					else if(method === 'error') Array.prototype.unshift.call(arguments, method);

					console[method].apply(null, arguments);
				};
			}
			return console[method].bind(console);
		}

		else return LogHelp._noop;
	};
};

if(typeof Proxy === 'function') Log = new Proxy(LogHelp._consoleWrap('log'), { get(target, method){ return LogHelp._consoleWrap(method); } });

else{
	Log = LogHelp._consoleWrap('log');
	Log.warn = LogHelp._consoleWrap('warn');
	Log.error = LogHelp._consoleWrap('error');

	Log.warn('Log', 'Enabled limited non ES6 support, only Log(v)(args), Log.warn(v)(args) and Log.error(v)(args) are available!');
}

if(typeof Dom !== 'undefined'){
	LogHelp.DBG = (parseInt(Dom.location.query.get('DBG')) || 0);
}

else{
	module.exports = Log;

	LogHelp.isNode = true;
	LogHelp.mapColors = process.env.COLOR;
	LogHelp.DBG = process.env.DBG;
}