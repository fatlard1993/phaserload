/* global Dom, Log */

var Socket = {
	activity: 0,
	init: function init(onopen_func, onmessage_func){
		Socket.active = new WebSocket('ws://'+ window.location.hostname +':'+ (window.location.port || 80));

		Socket.active.onmessage = function onmessage(message){
			Log(1)('message', message);
			var data = JSON.parse(message.data);

			if(data.command === 'reload'){
				setTimeout(function reload_TO(){ window.location.reload(false); }, data.delay);
			}

			else if(data.command === 'get out') Socket.disconnect(data.message);

			else if(data.command === 'goto_lobby'){
				window.location = window.location.protocol +'//'+ window.location.hostname +':'+ window.location.port +'/lobby';
			}

			else{
				if(onmessage_func) onmessage_func(data);
				if(Socket.onmessage) Socket.onmessage(data);
			}
		};

		Socket.active.onopen = function onopen(data){
			Log()('onopen', data);

			if(onopen_func) onopen_func(data);
		};

		Socket.active.onerror = function onerror(data){
			Log()('error', arguments);

			Log.error()('onerror', data);

			// Socket.disconnect('Socket communication errored out with code: '+ data.code);
		};

		Socket.active.onclose = function onclose(data){
			Log.warn()('onclose', data);

			if(!data.wasClean) Socket.disconnect('Socket communication has been lost!');
		};
	},
	disconnect: function disconnect(message){
		setTimeout(function disconnect_TO(){
			Socket.active.close();

			Log.warn()(message);
		}, 200);
	}
};