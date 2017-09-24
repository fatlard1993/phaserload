/* Allow extending native prototype */
/* jshint -W121 */

if(!Object.keys){
  Object.keys = (function(){
    'use strict';
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function(obj){
      if(typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)){
        throw new TypeError('Object.keys called on non-object');
      }

      var result = [], prop, i;

      for(prop in obj){
        if(hasOwnProperty.call(obj, prop)){
          result.push(prop);
        }
      }

      if(hasDontEnumBug){
        for(i = 0; i < dontEnumsLength; i++){
          if(hasOwnProperty.call(obj, dontEnums[i]))result.push(dontEnums[i]);
        }
      }
      return result;
    };
  }());
}

if(typeof Object.assign != 'function'){
  Object.assign = function(target, varArgs){
    'use strict';
    if(target == null) throw new TypeError('Cannot convert undefined or null to object');

    var to = Object(target);

    for(var index = 1; index < arguments.length; index++){
      var nextSource = arguments[index];

      if(nextSource != null){
        for(var nextKey in nextSource){
          if(Object.prototype.hasOwnProperty.call(nextSource, nextKey)) to[nextKey] = nextSource[nextKey];
        }
      }
    }
    return to;
  };
}

if(!Array.prototype.every){
  Array.prototype.every = function(callbackfn, thisArg){
    'use strict';
    var T, k;

    if(this == null) throw new TypeError('this is null or not defined');

    var O = Object(this);
    var len = O.length >>> 0;

    if(typeof callbackfn !== 'function') throw new TypeError();
    
    if(arguments.length > 1) T = thisArg;
    
    k = 0;

    while(k < len){
      var kValue;

      if(k in O){
        kValue = O[k];

        var testResult = callbackfn.call(T, kValue, k, O);

        if(!testResult) return false;
      }
      k++;
    }
    return true;
  };
}

if(!Array.prototype.includes){
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(searchElement, fromIndex){
      if(this == null) throw new TypeError('"this" is null or not defined');

      var o = Object(this);
      var len = o.length >>> 0;

      if(len === 0) return false;

      var n = fromIndex | 0;
      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y){
        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
      }

      while(k < len){
        if(sameValueZero(o[k], searchElement)) return true;
        k++;
      }

      return false;
    }
  });
}

if(!String.prototype.includes){
  String.prototype.includes = function(search, start){
    'use strict';
    if(typeof start !== 'number') start = 0;
    
    if(start + search.length > this.length) return false;
    else  return this.indexOf(search, start) !== -1;
  };
}

if(!String.prototype.startsWith){
  String.prototype.startsWith = function(searchString, position){
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

if(!String.prototype.repeat){
  String.prototype.repeat = function(count){
    'use strict';
    if(this == null) throw new TypeError('can\'t convert ' + this + ' to object');
    
    var str = '' + this;
    count = +count;
    if(count != count) count = 0;
    
    if(count < 0) throw new RangeError('repeat count must be non-negative');
    
    if(count == Infinity) throw new RangeError('repeat count must be less than infinity');
    
    count = Math.floor(count);
    if(str.length == 0 || count == 0) return '';
    
    if(str.length * count >= 1 << 28) throw new RangeError('repeat count must not overflow maximum string size');
    
    var rpt = '';
    for(;;){
      if((count & 1) == 1) rpt += str;
      
      count >>>= 1;
      if(count == 0) break;
      
      str += str;
    }
    return rpt;
  };
}

if(!Function.prototype.bind){
  Function.prototype.bind = function(oThis){
    if(typeof this !== 'function'){
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function(){},
        fBound  = function(){
          return fToBind.apply(this instanceof fNOP ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if(this.prototype){
      fNOP.prototype = this.prototype; 
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}

Math.log10 = Math.log10 || function(x){ return Math.log(x) / Math.LOG10E; };