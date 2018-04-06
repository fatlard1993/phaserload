/* global Log */

var WS = {
	room: 'unset',
	disconnectedQueue: [],
	onOpen: [],
	onMessage: [],
	onError: [],
	onClose: [],
	runEventFunctions: function(){
		var eventName = Array.prototype.shift.apply(arguments);

		for(var x = 0, funcCount = WS[eventName].length; x < funcCount; ++x){
			WS[eventName][x].apply(null, arguments);
		}
	},
	flushQueue: function(){
		if(!WS.disconnectedQueue.length) return;

		WS.active.send(WS.disconnectedQueue.shift());

		WS.flushQueue();
	},
	connect: function(){
		WS.active = new WebSocket('ws://'+ window.location.hostname +':'+ (window.location.port || 80));

		WS.active.onmessage = WS.onmessage_root;

		WS.active.onopen = WS.onopen_root;

		WS.active.onerror = WS.onerror_root;

		WS.active.onclose = WS.onclose_root;
	},
	reconnect: function(){
		WS.reconnecting = true;

		if(WS.reconnection_TO) return;

		WS.reconnection_TO_time = WS.reconnection_TO_time || 1500;

		WS.reconnection_TO = setTimeout(function(){
			Log()('Attempting reconnection... ', WS.reconnection_TO_time);

			WS.reconnection_TO = null;
			WS.reconnection_TO_time += 200;

			WS.connect();
		}, WS.reconnection_TO_time);
	},
	send: function(json, dontRetry){
		var message = JSON.stringify(json);

		// if(WS.active.readyState > 1){
		// 	if(!dontRetry) WS.disconnectedQueue.push(message);

		// 	WS.reconnect();
		// }

		// else
		WS.active.send(message);
	},
	onopen_root: function onopen(data){
		Log()('onopen', data);

		WS.reconnection_TO_time = null;

		WS.runEventFunctions('onOpen', data);
	},
	onmessage_root: function onmessage(message){
		Log(1)('message', message);

		var data = JSON.parse(message.data);

		if(data.command === 'challenge'){
			WS.send({ command: 'challenge_response', room: WS.room });
		}

		else if(data.command === 'reload'){
			setTimeout(function reload_TO(){ window.location.reload(false); }, data.delay);
		}

		else WS.runEventFunctions('onMessage', data);
	},
	onerror_root: function onerror(data){
		Log.error()('onerror', data);

		WS.runEventFunctions('onError', data);
	},
	onclose_root: function onclose(data){
		Log.warn()('onclose', data);

		WS.runEventFunctions('onClose', data);

		// WS.reconnect();
	}
};