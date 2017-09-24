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

var Log = new Proxy(ConsoleWrap('log'), { get(target, method){ return ConsoleWrap(method); } });