/* global Cjs, Dom, Log, WS, Interact, View */

var Loaded = false;

function Load(){
	if(Loaded) return;
	Loaded = true;

	var games;
	var createdGame = false;

	View.init('/lobby', {
		main: function(){
			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			var heading = Dom.createElem('div', { id: 'heading', textContent: 'Phaserload - Lobby' });

			var gamesList = Dom.createElem('ul', { id: 'GamesList' });
			var gameNames = Object.keys(games), gameCount = gameNames.length;

			gamesList.appendChild(Dom.createElem('li', { id: 'NewGame', className: 'game', textContent: 'New Game' }));

			for(var x = 0; x < gameCount; ++x){
				var li = Dom.createElem('li', { className: 'game', textContent: Object.keys(games[gameNames[x]].players).length });
				li.appendChild(Dom.createElem('span', { textContent: gameNames[x] }));

				gamesList.appendChild(li);
			}

			Dom.Content.appendChild(heading);
			Dom.Content.appendChild(gamesList);
		},
		new_game: function(){
			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			var heading = Dom.createElem('div', { id: 'heading', textContent: 'Phaserload - New Game' });

			var newGameForm = Dom.createElem('div', { id: 'NewGameForm' });

			var nameInput = Dom.createElem('input', { type: 'text', id: 'NewGameRoomName', placeholder: 'Room Name', validation: /^.{4,32}$/ });
			Dom.validate(nameInput);

			var startingWorld = Dom.createElem('input', { type: 'number', id: 'NewGameStartingWorld', placeholder: 'rand :: Starting world', validation: /(^([0-9]|10)$)|(^(?![\s\S]))/ });
			Dom.validate(startingWorld);

			var createButton = Dom.createElem('button', { id: 'NewGameCreateButton', textContent: 'Create' });
			var lobbyButton = Dom.createElem('button', { id: 'LobbyButton', textContent: 'Back to Lobby' });

			newGameForm.appendChild(nameInput);
			newGameForm.appendChild(startingWorld);
			newGameForm.appendChild(createButton);
			newGameForm.appendChild(lobbyButton);
			Dom.Content.appendChild(heading);
			Dom.Content.appendChild(newGameForm);

			nameInput.focus();
		}
	});

	function createNewGame(){
		if(!document.querySelectorAll('.invalid').length){
			Dom.Content = Dom.Content || document.getElementById('Content');

			createdGame = document.getElementById('NewGameRoomName').value;
			var startingWorld = document.getElementById('NewGameStartingWorld').value;

			var options = {
				name: createdGame,
				startingWorld: startingWorld.length ? startingWorld : 'rand'
			};

			Log()(createdGame, options);

			WS.send({ command: 'lobby_new_game', options: options });

			Dom.empty(Dom.Content);
		}
	}

	Interact.onPointerUp.push(function(evt){
		Log()(evt);

		if(evt.target.id === 'NewGame'){
			evt.preventDefault();
			Interact.pointerTarget = null;

			Log()(evt.target.textContent);

			View.draw('new_game');
		}

		else if(evt.target.className === 'game'){
			evt.preventDefault();
			Interact.pointerTarget = null;

			Log()(evt.target.textContent);

			Dom.changeLocation('/player?room='+ evt.target.children[0].textContent);

			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);
		}

		else if(evt.target.className.includes('toggle')){
			evt.preventDefault();
			Interact.pointerTarget = null;

			Log()(evt.target.textContent);

			evt.target.className = evt.target.className.includes('selected') ? 'toggle' : 'toggle selected';
		}

		else if(evt.target.id === 'NewGameCreateButton'){
			evt.preventDefault();
			Interact.pointerTarget = null;

			createNewGame();
		}

		else if(evt.target.id === 'LobbyButton'){
			evt.preventDefault();
			Interact.pointerTarget = null;

			Dom.Content = Dom.Content || document.getElementById('Content');

			Dom.empty(Dom.Content);

			View.draw('main');
		}
	});

	Interact.onKeyUp.push(function(evt, keyPressed){
		if(keyPressed === 'ENTER'){
			if(document.getElementById('NewGameCreateButton')){
				evt.preventDefault();

				createNewGame();
			}
		}
	});

	WS.room = 'lobby';

	WS.onMessage.push(function onSocketMessage(data){
		Log()(data);

		if(data.command === 'challenge_accept' || data.command === 'lobby_reload'){
			games = data.games;

			if(data.command === 'lobby_reload' && createdGame){
				Dom.changeLocation('/player?room='+ createdGame);

				Dom.Content = Dom.Content || document.getElementById('Content');

				Dom.empty(Dom.Content);
			}

			if(!View.current.length || (View.current === 'main')) View.draw();
		}

		else if(data.command === 'goto_lobby'){
			Dom.changeLocation('/lobby');
		}
	});

	WS.connect();

	Dom.setTitle('Phaserload - lobby');
}

document.addEventListener('DOMContentLoaded', Load);