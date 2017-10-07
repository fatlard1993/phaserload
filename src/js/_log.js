/* global console */

var DBG = 0;

function ConsoleWrap(method){
  return function _log(verbosity){
    if((verbosity || 0) < DBG && console && console[method]){
      return console[method].bind(console);
    }
    else return function _noop(){};
  };
}

var Log, Proxy = Proxy || null;

if(Proxy) Log = new Proxy(ConsoleWrap('log'), { get(target, method){ return ConsoleWrap(method); } });
else{
  // limited non ES6 support
  Log = ConsoleWrap('log');
  Log.warn = ConsoleWrap('warn');
  Log.error = ConsoleWrap('error');
}