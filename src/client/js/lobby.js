import log from './logger';
import lang from './lang/index';

import dom from 'dom';
import socketClient from 'socket-client';

const lobby = {
	load: function(){
		socketClient.init();

		dom.mobile.detect();

		socketClient.on('init', (options) => {
			lobby.options = options;

			socketClient.reply('client_join', { room: 'lobby' });
		});

		socketClient.on('state', (state) => {
			lobby.state = state;

			if(lobby.createdGame || !this.view || this.view === 'lobby') lobby.draw('lobby');
		});

		socketClient.on('close', (evt) => {
			log()('socketClient close', { 1005: 'force', 1006: 'lost server' }[evt.code]);
			log(1)(evt);

			if(evt.code !== 1005) socketClient.reconnect();
		});

		socketClient.on('error', (err) => {
			log.error()('socketClient error', err);

			// socketClient.reconnect();
		});

		dom.interact.on('keyUp', ({ keyPressed }) => {
			if(keyPressed === 'ENTER'){
				if(document.getElementById('newGameCreateButton')) lobby.createNewGame();
				else if(document.getElementById('gamesList').children.length > 1) dom.location.change(`/game?room=${document.getElementById('gamesList').children[1].children[0].textContent}`);
				else if(document.getElementById('newGame')) lobby.draw('new_game');
			}
		});

		dom.setTitle('Phaserload - lobby');
	},
	draw: function(view){
		dom.empty(dom.getElemById('wrapper'));

		this.view = view = view.toLowerCase().replace(' ', '_');

		dom.createElem('div', { id: 'heading', textContent: lang.parse(`{gameName} - {${view}}`), appendTo: dom.getElemById('wrapper') });

		this[`draw_${view}`]();
	},
	draw_lobby: function(){
		lobby.createdGame = false;

		const gamesList = dom.createElem('ul', { id: 'gamesList', appendTo: dom.getElemById('wrapper') });

		dom.createElem('li', { id: 'newGame', className: 'game', textContent: 'New Game', onPointerPress: lobby.draw.bind(lobby, 'new_game'), appendTo: gamesList });

		this.state.forEach(({ name, players }) => {
			dom.createElem('li', { className: 'game', textContent: players, appendChild: dom.createElem('span', { textContent: name }), onPointerPress: dom.location.change.bind(null, `/game?room=${name}`), appendTo: gamesList });
		});
	},
	draw_new_game: function(){
		var newGameForm = dom.createElem('div', { id: 'newGameForm', appendTo: dom.getElemById('wrapper') });

		var nameInput = dom.createElem('input', { type: 'text', id: 'newGameRoomName', placeholder: 'rand :: Room Name', validation: /^.{4,32}$|(^(?![\s\S]))/, validate: 0, appendTo: newGameForm });
		dom.createElem('input', { type: 'number', id: 'newGameStartingWorld', placeholder: 'rand :: Starting World Index', validation: /(^([0-9]|10)$)|(^(?![\s\S]))/, validate: 0, appendTo: newGameForm });
		dom.createElem('input', { type: 'text', id: 'newGameMode', placeholder: 'default :: Mode', validation: /^.{4,32}$|(^(?![\s\S]))/, validate: 0, appendTo: newGameForm });
		dom.createElem('input', { type: 'text', id: 'newGameWorldPack', placeholder: 'default :: World Pack', validation: /^.{4,32}$|(^(?![\s\S]))/, validate: 0, appendTo: newGameForm });

		dom.createElem('button', { id: 'newGameCreateButton', textContent: 'Create', appendTo: newGameForm, onPointerPress: this.createNewGame });
		dom.createElem('button', { id: 'lobbyButton', textContent: 'Back to Lobby', appendTo: newGameForm, onPointerPress: dom.location.change.bind(this, '/lobby') });

		nameInput.focus();
	},
	createNewGame: function(){
		if(!document.querySelectorAll('.invalid').length){
			lobby.createdGame = document.getElementById('newGameRoomName').value || 'rand';
			var startingWorld = document.getElementById('newGameStartingWorld').value;
			var mode = document.getElementById('newGameMode').value;
			var worldPack = document.getElementById('newGameWorldPack').value;

			var options = {
				name: lobby.createdGame,
				startingWorldIndex: startingWorld.length ? parseInt(startingWorld) : 'rand',
				mode: mode.length ? mode : 'default',
				worldPack: worldPack.length ? worldPack : 'default'
			};

			log()('Create game', options);

			socketClient.reply('create_game', options);
		}
	}
};

dom.onLoad(lobby.load);