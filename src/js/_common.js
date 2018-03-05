/* global Log */

var Cjs = {
	clone: function clone(it){
		if(typeof it !== 'object') return Log.error()('common', 'Cjs.clone only accepts Objects and Arrays');

		if(it instanceof Array) return it.slice(0);

		Log.warn(1)('common', 'Cjs.clone uses JSON stringify => parse to clone an object, some things may not behave as expected: Dates, functions, Infinity, undefined, etc..');

		return JSON.parse(JSON.stringify(it));
	},
	cleanArr: function cleanArr(arr, items){
		for(var x = 0, itemCount = arr.length, newArr = [], item; x < itemCount; ++x){
			item = arr[x];

			if(item && (!items || (items && !items.includes(item)))) newArr.push(item);
		}

		return newArr;
	},
	adjustArr: function adjustArr(arr, oldIndex, newIndex){
		var arrLen = arr.length, padding;

		while(oldIndex < 0) oldIndex += arrLen;
		while(newIndex < 0) newIndex += arrLen;

		if(newIndex >= arrLen){
			padding = newIndex - arrLen;

			while((padding--) + 1) arr.push(undefined);
		}

		arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);

		return arr;
	},
	sameArr: function sameArr(arr1, arr2){
		if(!arr1 || !arr2) return false;

		var arrLen = arr1.length;

		if(arrLen !== arr2.length) return false;

		for(var x = 0; x < arrLen; ++x){
			if(arr1[x] !== arr2[x]) return false;
		}

		return true;
	},
	inArr: function inArr(arr1, arr2){
		if(!arr1 || !arr2) return false;

		for(var x = 0, count = arr1.length; x < count; ++x){
			if(!arr2.includes(arr1[x])) return false;
		}

		return true;
	},
	anyInArr: function anyInArr(arr1, arr2){
		if(!arr1 || !arr2) return false;

		for(var x = 0, count = arr1.length; x < count; ++x){
			if(arr2.includes(arr1[x])) return true;
		}

		return false;
	},
	commonArr: function commonArr(){
		var arrays = Array.prototype.sort.call(arguments);

		arrays.sort(function(a, b){ return b.length - a.length; });

		var result = arrays.shift().reduce(function(res, val){
			if(!res.includes(val) && arrays.every(function(arr){ return arr.includes(val); })) res.push(val);

			return res;
		}, []);

		return result;
	},
	differenceArr: function differenceArr(arr1, arr2){
		var result = [], arr1Len = arr1.length, arr2Len = arr2.length, longerArr = arr1Len > arr2Len ? arr1 : arr2, shorterArr = arr1Len > arr2Len ? arr2 : arr1;

		for(var x = 0; x < longerArr.length; ++x){
			if(!shorterArr.includes(longerArr[x])) result.push(longerArr[x]);
		}

		return result;
	},
	sortArrAlphaNumeric: function(arr){
		var alphabeticRegex = /[^a-zA-Z]/g;
		var numericRegex = /[^0-9]/g;

		function sortAlphaNum(a, b){
			var AInt = parseInt(a);
			var BInt = parseInt(b);

			if(isNaN(AInt) && isNaN(BInt)){
				var aA = a.replace(alphabeticRegex, '');
				var bA = b.replace(alphabeticRegex, '');

				if(aA === bA) {
					var aN = parseInt(a.replace(numericRegex, ''));
					var bN = parseInt(b.replace(numericRegex, ''));

					return aN === bN ? 0 : aN > bN ? 1 : -1;
				}

				else{
					return aA > bA ? 1 : -1;
				}
			}

			else if(isNaN(AInt)){//A is not an Int
				return 1;//to make alphanumeric sort first return -1 here
			}

			else if(isNaN(BInt)){//B is not an Int
				return -1;//to make alphanumeric sort first return 1 here
			}

			else{
				return AInt > BInt ? 1 : -1;
			}
		}

		return arr.sort(sortAlphaNum);
	},
	arrIsNegative: function arrIsNegative(arr){
		return arr.every(function(element, index, array){ return element < 0; });
	},
	IPToDec: function IPToDec(ip){
		var octets = ip.split('.');
		return ((((((+octets[0]) * 256) + (+octets[1])) * 256) + (+octets[2])) * 256) + (+octets[3]);
	},
	decToIP: function decToIP(int){
		var oct_3 = int & 255;
		var oct_2 = ((int >> 8) & 255);
		var oct_1 = ((int >> 16) & 255);
		var oct_0 = ((int >> 24) & 255);

		return oct_0 + '.' + oct_1 + '.' + oct_2 + '.' + oct_3;
	},
	decToHex: function decToHex(dec, length){
		length = length || 8;
		var output = (parseInt(dec) + Math.pow(16, length)).toString(16).substr(-length).toString();

		if(output === 'NaN'){
			output = '0'.repeat(length);
			Log.error()('dec2hex isNaN', dec, length, output);
		}

		return output;
	},
	stringToHex: function stringToHex(string, charBytes){
		var hex = '', stringLen = string.length, x, charHex;

		for(x = 0; x < stringLen; ++x){
			charHex = Number(string.charCodeAt(x)).toString(16);
			hex += charBytes ? '0'.repeat(charBytes - charHex.length) + charHex : charHex;
		}

		return hex;
	},
	hexToString: function hexToString(hex, charBytes){
		hex = hex.toString();
		charBytes = charBytes || 2;

		var string = '', hexLen = hex.length, x;

		for(x = 0; x < hexLen; x += charBytes){
			string += String.fromCharCode(parseInt(hex.substr(x, charBytes), 16));
		}

		return string;
	},
	findRanges: function(arr, simplify){
		var arrLength = arr.length;
		if(!arrLength) return arr;

		arr = arr.sort(function(a, b){ return a - b; });

		var ranges = [], range = 0;

		for(var x = 0; x < arrLength; ++x){
			ranges[range] = ranges[range] || [];

			if(simplify){
				ranges[range][Math.min(1, ranges[range].length)] = arr[x];
			}
			else{
				ranges[range].push(arr[x]);
			}

			if(arr[x + 1] - arr[x] !== 1 && x < arrLength - 1) range++;
		}

		return ranges;
	},
	rand: function rand(min, max){
		return Math.random() * (max - min) + min;
	},
	randInt: function randInt(min, max){
		return parseInt(Cjs.rand(min, max));
	},
	randTF: function randTF(){
		return !!(Math.random() < 0.5 ? 1 : 0);
	},
	randColor: function randColor(){
		return '#'+ Math.floor(Math.random() * 16777215).toString(16);
	},
	randFromArr: function randFromArr(arr){
		var arrLen = arr.length;

		return arr[Cjs.rand(0, arrLen - 1)];
	},
	incChar: function incChar(char, inc){
		return String.fromCharCode(char.charCodeAt(0) + (inc === 0 ? 0 : inc || 1));
	},
	toggle: function toggle(bool){ return (bool ^= 1); },
	run: function run(arr, destructive){
		if(!destructive) arr = Cjs.clone(arr);

		var task;

		while((task = arr.shift())) task();
	},
	capitalize: function capitalize(str, recursive){
		for(var x = 0, words = str.split(' '), wordCount = words.length, word; x < (recursive ? wordCount : 1); ++x){
			word = words[x];

			words[x] = word.charAt(0).toUpperCase() + word.slice(1);
		}

		return words.join(' ');
	},
	fromCamelCase: function fromCamelCase(string, joiner){
		return string.split(/(?=[A-Z])/).join(joiner || ' ');
	},
	objectValues: function objectValues(obj){
		return Object.keys(obj).map(function(key){ return obj[key]; });
	}
};

try{
	module.exports = Cjs;
}
catch(e){
// console.error(e);
}