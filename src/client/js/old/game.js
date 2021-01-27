import log from '../logger';
import lang from '../lang/index';
import phaserload from '../phaserload';
import '../entities/index';
import './states/index';

import dom from 'dom';
import socketClient from 'socket-client';
import Phaser from './node_modules/phaser/dist/phaser.min.js';

const game = {
	player: {
		room: dom.location.query.get('room')
	},
	playerChangeQueue: {},
	groundChangeQueue: {},
	cyclingPlayerQueue: false,
	cyclingGroundQueue: false,
	load: function(){
		document.addEventListener('visibilitychange', function(evt){
			log(1)(evt, document.hidden);

			if(document.hidden) return;

			log(1)(game.playerChangeQueue, game.groundChangeQueue);

			game.cyclePlayerQueue();
			game.cycleGroundQueue();
		});

		dom.interact.on('pointerUp', function(evt){
			log()(evt);

			if(evt.target.id === 'JoinGameButton'){
				evt.preventDefault();

				game.joinGame();
			}

			else if(evt.target.id === 'LobbyButton'){
				evt.preventDefault();

				dom.empty(dom.getElemById('wrapper'));

				dom.location.change('/lobby');
			}
		});

		dom.interact.on('keyUp', function(evt){
			if(evt.keyPressed === 'ENTER'){
				if(document.getElementById('JoinGameButton')){
					evt.preventDefault();

					game.joinGame();
				}
			}
		});

		// WS.onMessage.push(function onSocketMessage(data){
		// 	Log(2)(data);

		// 	if(data.command === 'challenge_accept'){
		// 		game.players = data.players;

		// 		View.draw();
		// 	}

		// 	else if(data.command === 'player_join_accept'){
		// 		game.players = data.players;
		// 		game.spaceco = data.spaceco;
		// 		game.config.items = data.items;

		// 		game.player = data.players[Player.name];

		// 		game.config = Object.assign(game.config, data.mapData);

		// 		game.draw_play();
		// 	}

		// 	else if(data.command === 'goto_lobby'){
		// 		dom.location.change('/lobby');
		// 	}

		// 	if(!data.room || !Player.room || data.room !== Player.room) return;

		// 	if(data.command === 'player_join'){
		// 		if(data.player.name === Player.name) return;

		// 		game.players[data.player.name] = data.player;

		// 		if(View.current === 'play'){
		// 			game.players[data.player.name].sprite = game.entities.player.create(data.player);
		// 		}
		// 	}

		// 	else if(data.command === 'player_leave'){
		// 		game.players[data.name].sprite.destroy();

		// 		delete game.players[data.name];
		// 	}

		// 	else if(data.command === 'new_world'){
		// 		game.spaceco.position = data.spaceco.position;
		// 		game.spaceco.parts = data.spaceco.parts;
		// 		game.spaceco.resourceBay = data.spaceco.resourceBay;
		// 		game.options = data.options;

		// 		game.player.position = data.players[Player.name].position;

		// 		game.ground.forEachAlive(function(ground){ ground.destroy(); });
		// 		game.minerals.forEachAlive(function(mineral){ mineral.destroy(); });
		// 		game.lava.forEachAlive(function(lava){ lava.destroy(); });
		// 		game.gas.forEachAlive(function(gas){ gas.destroy(); });

		// 		game.config = Object.assign(game.config, data.mapData);

		// 		game.drawMap(0, 0, game.config.width, game.config.depth / 2);

		// 		game.phaser.add.tween(game.player.sprite).to({ x: game.toPx(game.player.position.x), y: game.toPx(game.player.position.y) }, 100, Phaser.Easing.Sinusoidal.InOut, true);

		// 		setTimeout(function(){
		// 			game.hud.close();

		// 			game.adjustViewPosition(game.player.sprite.x - game.viewWidth / 2, game.player.sprite.y - game.viewHeight / 2, Math.ceil(game.phaser.math.distance(game.player.sprite.x, game.player.sprite.y, game.phaser.camera.x / 2, game.phaser.camera.y / 2)));
		// 		}, 2000);
		// 	}

		// 	if(View.current === 'join' || data.player === Player.name) return;

		// 	else if(data.command === 'player_move'){
		// 		if(!document.hidden && !cyclingPlayerQueue) return game.movePlayer(data);

		// 		playerChangeQueue[data.player] = data;

		// 		if(game.player.sprite.x === data.position.x && game.player.sprite.y === data.position.y){
		// 			game.player.tradee = data.player;
		// 			game.notify('Open to trade\nwith '+ data.player, 4);
		// 		}
		// 		else if(data.player === game.player.tradee){
		// 			game.player.tradee = null;
		// 			if(game.hud.isOpen.name === 'trade') game.hud.close();
		// 		}
		// 	}

		// 	else if(data.command === 'player_set_map_position'){
		// 		if(!document.hidden && !cyclingGroundQueue) return game.setMapPos(data.pos, data.id, data.animation, 1);

		// 		groundChangeQueue[JSON.stringify(data.pos)] = data;
		// 	}

		// 	else if(data.command === 'player_purchase_part'){
		// 		delete game.spaceco.parts[data.partName];
		// 	}

		// 	else if(data.command === 'player_update_offer' && data.to === Player.name){
		// 		game.player.tradeFor = data.offer;

		// 		game.hud.bottomLine.setText('offer updated');
		// 	}

		// 	else if(data.command === 'player_accept_offer' && data.to === Player.name){
		// 		game.player.offer_accepted = 1;

		// 		if(game.player.offer_sent_accept) game.player.acceptOffer();

		// 		else game.hud.bottomLine.setText(game.player.tradee +' has accepted');
		// 	}

		// 	else if(data.command === 'crush_mineral'){
		// 		game.entities.mineral.crush(data.pos);
		// 	}

		// 	else if(data.command === 'player_death'){
		// 		game.notify(data.player + (data.by === 'fuel' ? 'ran out of fuel' : '\ndied by '+ data.by) +'\nat: '+ data.at, 4);
		// 	}

		// 	else if(data.command === 'explosion'){
		// 		var distanceFromPlayer = game.phaser.math.distance(data.pos.x, data.pos.y, game.player.sprite.x, game.player.sprite.y);

		// 		var intensity = Math.max(1, (data.radius * 2) + (data.radius - (distanceFromPlayer / phaserload.blockPx)));
		// 		game.phaser.camera.shake(intensity / 1000, 1000);

		// 		if(!game.player.isDisoriented && (distanceFromPlayer / phaserload.blockPx) < 10) game.phaser.camera.flash(undefined, 1000, 1, 0.3);
		// 	}

		// 	else if(data.command === 'player_sell_minerals'){
		// 		game.spaceco.resourceBay = data.resourceBay;
		// 	}
		// });

		dom.setTitle('Phaserload - player');
	},
	draw_join: function(){
		dom.empty(dom.getElemById('wrapper'));

		var heading = dom.createElem('div', { id: 'heading', textContent: 'Phaserload - Join '+ game.player.room });

		var joinGameForm = dom.createElem('div', { id: 'JoinGameForm' });

		var cachedName = dom.cookie.get('player_name');

		var nameInput = dom.createElem('input', { id: 'JoinGameName', placeholder: 'Your Name', validation: /^.{4,32}$/, value: cachedName ? cachedName : '' });
		dom.validate(nameInput);

		var joinButton = dom.createElem('button', { id: 'JoinGameButton', textContent: 'Join' });

		var lobbyButton = dom.createElem('button', { id: 'LobbyButton', textContent: 'Back to Lobby' });

		dom.getElemById('wrapper').appendChild(heading);
		joinGameForm.appendChild(nameInput);
		joinGameForm.appendChild(joinButton);
		joinGameForm.appendChild(lobbyButton);
		dom.getElemById('wrapper').appendChild(joinGameForm);

		nameInput.focus();
	},
	draw_play: function(){
		dom.empty(dom.getElemById('wrapper'));

		var gameContainer = dom.createElem('div', { id: 'game', appendTo: dom.getElemById('wrapper') });

		var clientHeight = document.body.clientHeight - 4;
		var clientWidth = document.body.clientWidth - 3;
		var minViewWidth = 10 * phaserload.blockPx;
		var minViewHeight = 8 * phaserload.blockPx;
		var scale = (clientWidth < minViewWidth ? minViewWidth / clientWidth : 1);

		if(clientHeight - minViewHeight < clientWidth - minViewWidth) scale = (clientHeight < minViewHeight ? minViewHeight / clientHeight : 1);

		game.viewWidth = Math.max(minViewWidth, clientWidth * scale);
		game.viewHeight = clientHeight * scale;

		game.phaser = new Phaser.game(game.viewWidth, game.viewHeight, Phaser.AUTO, 'game');//WEBGL_MULTI

		game.phaser.state.add('load', game.states.load);
		game.phaser.state.add('start', game.states.start);
		game.phaser.state.add('end', game.states.end);

		setTimeout(function(){
			if(scale !== 1){
				game.phaser.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
				game.phaser.scale.pageAlignHorizontally = true;
				game.phaser.scale.pageAlignVertically = true;

				scale = (1 / scale);

				var gameCanvas = gameContainer.children[0];
				var marginTop = (game.viewHeight - (game.viewHeight * scale)) / 2;
				var marginLeft = (game.viewWidth - (game.viewWidth * scale)) / 2;

				// gameCanvas.style.transform = 'scale('+ scale +')';
				gameCanvas.style.marginTop = -marginTop + 'px';
				gameCanvas.style.marginLeft = -marginLeft + 'px';
			}

			game.phaser.add.plugin(Phaser.Plugin.Debug);

			game.phaser.stage.backgroundColor = game.config.backgroundColor;

			game.phaser.load.crossOrigin = 'anonymous';
			game.phaser.load.maxParallelDownloads = Infinity;

			game.phaser.stage.disableVisibilityChange = true;
			game.phaser.clearBeforeRender = false;

			game.phaser.state.start('load');
		}, 1000);
	},
	joinGame: function(){
		if(!document.querySelectorAll('.invalid').length){
			var nameInput = document.getElementById('JoinGameName');

			if(Object.keys(game.players).includes(nameInput.value)){
				nameInput.className = nameInput.className.replace(/\svalidated|\sinvalid/g, '') + ' invalid';

				return;
			}

			game.player.name = nameInput.value;

			dom.cookie.set('player_name', game.player.name);

			socketClient.reply('player_join', { game_room: game.player.room, playerName: game.player.name });

			dom.empty(dom.getElemById('wrapper'));
		}
	},
	cyclePlayerQueue: function(){
		var queue = game.playerChangeQueue, ids = Object.keys(queue), queueLen = ids.length;
		game.playerChangeQueue = {};
		game.cyclingPlayerQueue = true;

		if(!queueLen) return;

		log(1)('cycling player queue: ', queue);

		for(var x = 0; x < queueLen; ++x){
			game.movePlayer(queue[ids[x]]);
		}

		game.cyclingPlayerQueue = false;

		game.cyclePlayerQueue();
	},
	cycleGroundQueue: function(){
		var queue = game.groundChangeQueue, ids = Object.keys(queue), queueLen = ids.length;
		game.groundChangeQueue = {};
		game.cyclingGroundQueue = true;

		if(!queueLen) return;

		log(1)('cycling ground queue: ', queue);

		for(var x = 0; x < queueLen; ++x){
			game.setMapPos(queue[ids[x]].pos, queue[ids[x]].id, queue[ids[x]].animation, 1);
		}

		game.cyclingGroundQueue = false;

		game.cycleGroundQueue();
	}
};

dom.onLoad(game.load);