/* global Cjs, Dom, Log, Socket, Interact, Game, Phaser */

var Loaded = false;

function Load(){
	if(Loaded) return;
	Loaded = true;

	var Player = {
		room: Dom.location.query.get('room')
	};

	var views = {
		main: function(){
			var joinGameForm = Dom.createElem('div', { id: 'JoinGameForm' });

			var cachedName = Dom.cookie.get('player_name');

			var nameInput = Dom.createElem('input', { id: 'JoinGameName', placeholder: 'Your Name', validation: /^.{4,32}$/, value: cachedName ? cachedName : '' });
			Dom.validate(nameInput);

			var joinButton = Dom.createElem('button', { id: 'JoinGameButton', textContent: 'Join' });

			var lobbyButton = Dom.createElem('button', { id: 'LobbyButton', textContent: 'Back to Lobby' });

			joinGameForm.appendChild(nameInput);
			joinGameForm.appendChild(joinButton);
			joinGameForm.appendChild(lobbyButton);
			Dom.Content.appendChild(joinGameForm);

			nameInput.focus();
		},
		play: function(){
			var gameContainer = Dom.createElem('div', { id: 'Game' });

			Dom.Content.appendChild(gameContainer);

			var borderSize = 1;

			var clientHeight = document.body.clientHeight - (borderSize * 2);
			var clientWidth = document.body.clientWidth - (borderSize * 2);
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
	};

	function onSocketMessage(data){
		Log()(data);

		if(data.command === 'challenge'){
			Socket.active.send('{ "command": "challenge_response", "room": "player", "game_room": "'+ Player.room +'" }');
		}

		else if(data.command === 'challenge_accept'){
			Game.config.players = data.players;

			Dom.draw();
		}

		else if(data.command === 'player_join_accept'){
			Game.config.players = data.players;
			Game.config.spaceco = data.spaceco;
			Game.options = data.options;

			Game.config.playerName = Player.name;

			Game.config = Object.assign(Game.config, data.mapData);

			Dom.draw('play');
		}

		if(!data.room || !Player.room || data.room !== Player.room) return;

		if(data.command === 'player_join'){
			if(data.name === Player.name) return;

			Game.players[data.player.name] = data.player;
		}

		else if(data.command === 'player_leave'){
			delete Game.players[data.player.name];
		}

		if(Game.currentView === 'main') return;
	}

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

			Socket.active.send('{ "command": "player_join", "game_room": "'+ Player.room +'", "playerName": "'+ Player.name +'" }');

			Dom.empty(Dom.Content);
		}
	}

	Dom.draw = function draw(view){
		Dom.Content = Dom.Content || document.getElementById('Content');

		Dom.empty(Dom.Content);

		Dom.setTitle('Phaserload - player');

		Game.currentView = view || 'main';

		views[Game.currentView](arguments[1]);
	};

	Interact.onPointerUp = function(evt){
		Log()(evt);

		if(evt.target.id === 'JoinGameButton'){
			evt.preventDefault();

			joinGame();
		}

		else if(evt.target.id === 'LobbyButton'){
			evt.preventDefault();

			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			window.location = window.location.protocol +'//'+ window.location.hostname +':'+ window.location.port +'/lobby';
		}
	};

	Interact.onKeyUp = function(evt, keyPressed){
		if(keyPressed === 'ENTER'){
			if(document.getElementById('JoinGameButton')){
				evt.preventDefault();

				joinGame();
			}
		}
	};

	Socket.init(null, onSocketMessage);
}

document.addEventListener('DOMContentLoaded', Load);