/* global Cjs, Dom, Log, Socket, Interact */

var Loaded = false;

function Load(){
	if(Loaded) return;
	Loaded = true;

	var games;
	var createdGame = false;
	var currentView = 'main';

	var views = {
		main: function(){
			var gamesList = Dom.createElem('ul', { id: 'GamesList' });
			var gameNames = Object.keys(games), gameCount = gameNames.length;

			gamesList.appendChild(Dom.createElem('li', { id: 'NewGame', className: 'game', textContent: 'New Game' }));

			for(var x = 0; x < gameCount; ++x){
				var li = Dom.createElem('li', { className: 'game', textContent: Object.keys(games[gameNames[x]].players).length });
				li.appendChild(Dom.createElem('span', { textContent: gameNames[x] }));

				gamesList.appendChild(li);
			}

			Dom.Content.appendChild(gamesList);
		},
		new_game: function(){
			var newGameForm = Dom.createElem('div', { id: 'NewGameForm' });

			var nameInput = Dom.createElem('input', { type: 'text', id: 'NewGameRoomName', placeholder: 'Room Name', validation: /^.{4,32}$/ });
			Dom.validate(nameInput);

			var createButton = Dom.createElem('button', { id: 'NewGameCreateButton', textContent: 'Create' });
			var lobbyButton = Dom.createElem('button', { id: 'LobbyButton', textContent: 'Back to Lobby' });

			newGameForm.appendChild(nameInput);
			newGameForm.appendChild(createButton);
			newGameForm.appendChild(lobbyButton);
			Dom.Content.appendChild(newGameForm);

			nameInput.focus();
		},
		existing_game: function(name){
			var title = Dom.createElem('div', { className: 'gameTitle', textContent: name });

			var playButton = Dom.createElem('button', { id: 'PlayButton', textContent: 'Play' });
			var lobbyButton = Dom.createElem('button', { id: 'LobbyButton', textContent: 'Back to Lobby' });

			Dom.Content.appendChild(title);
			Dom.Content.appendChild(playButton);
			Dom.Content.appendChild(lobbyButton);
		}
	};

	function onSocketMessage(data){
		Log()(data);

		if(data.command === 'challenge'){
			Socket.active.send('{ "command": "challenge_response", "room": "lobby" }');
		}

		else if(data.command === 'challenge_accept' || data.command === 'lobby_reload'){
			games = data.games;

			if(data.command === 'lobby_reload' && createdGame){
				window.location = window.location.protocol +'//'+ window.location.hostname +':'+ window.location.port +'/player?room='+ createdGame;

			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);
			}

			if(currentView === 'main') Dom.draw();
		}
	}

	function createNewGame(){
		if(!document.querySelectorAll('.invalid').length){
			Dom.Content = Dom.Content || document.getElementById('Content');

			createdGame = document.getElementById('NewGameRoomName').value;

			var options = {
				name: createdGame
			};

			Log()(createdGame, options);

			Socket.active.send(JSON.stringify({ command: 'lobby_new_game', options: options }));

			Dom.empty(Dom.Content);
		}
	}

	Dom.draw = function draw(view){
		currentView = view || 'main';

		Dom.Content = Dom.Content || document.getElementById('Content');

		Dom.empty(Dom.Content);

		Dom.setTitle('Phaserload - lobby');

		views[currentView](arguments[1]);
	};

	Interact.onPointerUp = function(evt){
		Log()(evt);

		if(evt.target.id === 'NewGame'){
			evt.preventDefault();

			Log()(evt.target.textContent);

			Dom.draw('new_game');
		}

		else if(evt.target.className === 'game'){
			evt.preventDefault();

			Log()(evt.target.textContent);

			window.location = window.location.protocol +'//'+ window.location.hostname +':'+ window.location.port +'/player?room='+ evt.target.children[0].textContent;

			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);
		}

		else if(evt.target.className.includes('toggle')){
			evt.preventDefault();

			Log()(evt.target.textContent);

			evt.target.className = evt.target.className.includes('selected') ? 'toggle' : 'toggle selected';
		}

		else if(evt.target.id === 'NewGameCreateButton'){
			evt.preventDefault();

			createNewGame();
		}

		else if(evt.target.id === 'LobbyButton'){
			evt.preventDefault();

			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			window.location.reload();
		}
	};

	Interact.onKeyUp = function(evt, keyPressed){
		if(keyPressed === 'ENTER'){
			if(document.getElementById('NewGameCreateButton')){
				evt.preventDefault();

				createNewGame();
			}
		}
	};

	Socket.init(null, onSocketMessage);
}

document.addEventListener('DOMContentLoaded', Load);