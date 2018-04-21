/* global Cjs, Dom, Log, WS, Interact, Game, Phaser, View */

var Loaded = false;

function Load(){
	if(Loaded) return;
	Loaded = true;

	var playerChangeQueue = {};
	var groundChangeQueue = {};
	var cyclingPlayerQueue = false;
	var cyclingGroundQueue = false;

	document.addEventListener('visibilitychange', function(evt){
		Log(1)(evt, document.hidden);
		if(document.hidden) return;

		Log(1)(playerChangeQueue, groundChangeQueue);

		cyclePlayerQueue();
		cycleGroundQueue();
	});

	function cyclePlayerQueue(){
		var queue = playerChangeQueue, ids = Object.keys(queue), queueLen = ids.length;
		playerChangeQueue = {};
		cyclingPlayerQueue = true;

		if(!queueLen) return;

		Log(1)('cycling player queue: ', queue);

		for(var x = 0; x < queueLen; ++x){
			Game.movePlayer(queue[ids[x]]);
		}

		cyclingPlayerQueue = false;

		cyclePlayerQueue();
	}

	function cycleGroundQueue(){
		var queue = groundChangeQueue, ids = Object.keys(queue), queueLen = ids.length;
		groundChangeQueue = {};
		cyclingGroundQueue = true;

		if(!queueLen) return;

		Log(1)('cycling ground queue: ', queue);

		for(var x = 0; x < queueLen; ++x){
			Game.setMapPos(queue[ids[x]].pos, queue[ids[x]].id, 1);
		}

		cyclingGroundQueue = false;

		cycleGroundQueue();
	}

	var Player = {
		room: Dom.location.query.get('room')
	};

	View.init('/player', {
		join: function(){
			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			var heading = Dom.createElem('div', { id: 'heading', textContent: 'Phaserload - Join '+ Player.room });

			var joinGameForm = Dom.createElem('div', { id: 'JoinGameForm' });

			var cachedName = Dom.cookie.get('player_name');

			var nameInput = Dom.createElem('input', { id: 'JoinGameName', placeholder: 'Your Name', validation: /^.{4,32}$/, value: cachedName ? cachedName : '' });
			Dom.validate(nameInput);

			var joinButton = Dom.createElem('button', { id: 'JoinGameButton', textContent: 'Join' });

			var lobbyButton = Dom.createElem('button', { id: 'LobbyButton', textContent: 'Back to Lobby' });

			Dom.Content.appendChild(heading);
			joinGameForm.appendChild(nameInput);
			joinGameForm.appendChild(joinButton);
			joinGameForm.appendChild(lobbyButton);
			Dom.Content.appendChild(joinGameForm);

			nameInput.focus();
		},
		play: function(){
			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			var gameContainer = Dom.createElem('div', { id: 'Game' });

			Dom.Content.appendChild(gameContainer);

			var clientHeight = document.body.clientHeight - 4;
			var clientWidth = document.body.clientWidth - 3;
			var minViewWidth = 10 * Game.blockPx;
			var minViewHeight = 8 * Game.blockPx;
			var scale = (clientWidth < minViewWidth ? minViewWidth / clientWidth : 1);

			if(clientHeight - minViewHeight < clientWidth - minViewWidth) scale = (clientHeight < minViewHeight ? minViewHeight / clientHeight : 1);

			Game.viewWidth = Math.max(minViewWidth, clientWidth * scale);
			Game.viewHeight = clientHeight * scale;

			Game.phaser = new Phaser.Game(Game.viewWidth, Game.viewHeight, null, 'Game');

			Game.phaser.state.add('load', Game.states.load);
			Game.phaser.state.add('start', Game.states.start);
			Game.phaser.state.add('end', Game.states.end);

			setTimeout(function(){
				if(scale !== 1){
					Game.phaser.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
					Game.phaser.scale.pageAlignHorizontally = true;
					Game.phaser.scale.pageAlignVertically = true;

					scale = (1 / scale);

					var gameCanvas = gameContainer.children[0];
					var marginTop = (Game.viewHeight - (Game.viewHeight * scale)) / 2;
					var marginLeft = (Game.viewWidth - (Game.viewWidth * scale)) / 2;

					// gameCanvas.style.transform = 'scale('+ scale +')';
					gameCanvas.style.marginTop = -marginTop + 'px';
					gameCanvas.style.marginLeft = -marginLeft + 'px';
				}

				Game.phaser.stage.backgroundColor = Game.config.backgroundColor;

				Game.phaser.state.start('load');
			}, 1000);
		}
	});

	function joinGame(){
		if(!document.querySelectorAll('.invalid').length){
			var nameInput = document.getElementById('JoinGameName');

			if(Object.keys(Game.players).includes(nameInput.value)){
				nameInput.className = nameInput.className.replace(/\svalidated|\sinvalid/g, '') + ' invalid';

				return;
			}

			Dom.Content = Dom.Content || document.getElementById('Content');

			Player.name = nameInput.value;

			Dom.cookie.set('player_name', Player.name);

			WS.send({ command: 'player_join', game_room: Player.room, playerName: Player.name });

			Dom.empty(Dom.Content);
		}
	}

	Interact.onPointerUp.push(function(evt){
		Log()(evt);

		if(evt.target.id === 'JoinGameButton'){
			evt.preventDefault();
			Interact.pointerTarget = null;

			joinGame();
		}

		else if(evt.target.id === 'LobbyButton'){
			evt.preventDefault();
			Interact.pointerTarget = null;

			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			Dom.changeLocation('/lobby');
		}
	});

	Interact.onKeyUp.push(function(evt, keyPressed){
		if(keyPressed === 'ENTER'){
			if(document.getElementById('JoinGameButton')){
				evt.preventDefault();

				joinGame();
			}
		}
	});

	WS.onMessage.push(function onSocketMessage(data){
		Log(2)(data);

		if(data.command === 'challenge_accept'){
			Game.players = data.players;

			View.draw();
		}

		else if(data.command === 'player_join_accept'){
			Game.players = data.players;
			Game.spaceco = data.spaceco;
			Game.config.items = data.items;

			Game.player = data.players[Player.name];

			Game.config = Object.assign(Game.config, data.mapData);

			View.draw('play');
		}

		else if(data.command === 'goto_lobby'){
			Dom.changeLocation('/lobby');
		}

		if(!data.room || !Player.room || data.room !== Player.room) return;

		if(data.command === 'player_join'){
			if(data.player.name === Player.name) return;

			Game.players[data.player.name] = data.player;

			if(View.current === 'play'){
				Game.players[data.player.name].sprite = Game.entities.player.create(data.player);
			}
		}

		else if(data.command === 'player_leave'){
			Game.players[data.name].sprite.destroy();

			delete Game.players[data.name];
		}

		else if(data.command === 'new_world'){
			Game.spaceco.position = data.spaceco.position;
			Game.spaceco.parts = data.spaceco.parts;
			Game.spaceco.resourceBay = data.spaceco.resourceBay;
			Game.options = data.options;

			Game.player.position = data.players[Player.name].position;

			Game.ground.forEachAlive(function(ground){ ground.destroy(); });
			Game.minerals.forEachAlive(function(mineral){ mineral.destroy(); });
			Game.lava.forEachAlive(function(lava){ lava.destroy(); });
			Game.gas.forEachAlive(function(gas){ gas.destroy(); });

			Game.config = Object.assign(Game.config, data.mapData);

			Game.drawMap(0, 0, Game.config.width, Game.config.depth / 2);

			Game.phaser.add.tween(Game.player.sprite).to({ x: Game.toPx(Game.player.position.x), y: Game.toPx(Game.player.position.y) }, 100, Phaser.Easing.Sinusoidal.InOut, true);

			setTimeout(function(){
				Game.hud.close();

				Game.adjustViewPosition(Game.player.sprite.x - Game.viewWidth / 2, Game.player.sprite.y - Game.viewHeight / 2, Math.ceil(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, Game.phaser.camera.x / 2, Game.phaser.camera.y / 2)));
			}, 2000);
		}

		if(View.current === 'join' || data.player === Player.name) return;

		else if(data.command === 'player_move'){
			if(!document.hidden && !cyclingPlayerQueue) return Game.movePlayer(data);

			playerChangeQueue[data.player] = data;

			if(Game.player.sprite.x === data.position.x && Game.player.sprite.y === data.position.y){
				Game.player.tradee = data.player;
				Game.notify('Open to trade\nwith '+ data.player, 4);
			}
			else if(data.player === Game.player.tradee){
				Game.player.tradee = null;
				if(Game.hud.isOpen.name === 'trade') Game.hud.close();
			}
		}

		else if(data.command === 'player_set_map_position'){
			if(!document.hidden && !cyclingGroundQueue) return Game.setMapPos(data.pos, data.id, 1, data.animation);

			groundChangeQueue[JSON.stringify(data.pos)] = data;
		}

		else if(data.command === 'player_purchase_part'){
			delete Game.spaceco.parts[data.partName];
		}

		else if(data.command === 'player_update_offer' && data.to === Player.name){
			Game.player.tradeFor = data.offer;

			Game.hud.bottomLine.setText('offer updated');
		}

		else if(data.command === 'player_accept_offer' && data.to === Player.name){
			Game.player.offer_accepted = 1;

			if(Game.player.offer_sent_accept) Game.player.acceptOffer();

			else Game.hud.bottomLine.setText(Game.player.tradee +' has accepted');
		}

		else if(data.command === 'crush_mineral'){
			Game.entities.mineral.crush(data.pos);
		}

		else if(data.command === 'player_death'){
			Game.notify(data.player + (data.by === 'fuel' ? 'ran out of fuel' : '\ndied by '+ data.by) +'\nat: '+ data.at, 4);
		}

		else if(data.command === 'explosion'){
			var distanceFromPlayer = Game.phaser.math.distance(data.pos.x, data.pos.y, Game.player.sprite.x, Game.player.sprite.y);

			var intensity = Math.max(1, (data.radius * 2) + (data.radius - (distanceFromPlayer / Game.blockPx)));
			Game.phaser.camera.shake(intensity / 1000, 1000);

			if(!Game.player.isDisoriented && (distanceFromPlayer / Game.blockPx) < 10) Game.phaser.camera.flash(undefined, 1000, 1, 0.3);
		}

		else if(data.command === 'player_sell_minerals'){
			Game.spaceco.resourceBay = data.resourceBay;
		}
	});

	WS.room = 'player_'+ Player.room;

	WS.connect();

	Dom.setTitle('Phaserload - player');
}

document.addEventListener('DOMContentLoaded', Load);