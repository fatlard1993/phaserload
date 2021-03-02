import log from './logger';
import lang from './lang/index';
import phaserload from './phaserload';
import './scenes/index';

import dom from 'dom';
import socketClient from 'socket-client';

const game = {
	room: dom.location.query.get('room'),
	load: function(){
		socketClient.init();

		dom.mobile.detect();

		socketClient.on('init', (options) => {
			game.options = options;

			game.draw('join');

			socketClient.reply('room_check', game.room);
		});

		socketClient.on('redirect', dom.location.change);

		socketClient.on('options', (options) => {
			log()('options', options);

			phaserload.options = options;
		});

		socketClient.on('player_state', (state) => {
			log()('player_state', state);

			phaserload.player = Object.assign(phaserload.player, state);
		});

		socketClient.on('invalid_move', () => {
			log()('invalid_move');

			phaserload.player.midMove = false;
		});

		socketClient.on('state', (state) => {
			log()('state', state);

			phaserload.state = state;

			if(game.view === 'join') game.draw('play');

			else if(game.view === 'play') phaserload.update();
		});

		socketClient.on('console_connect', (type) => {
			log()('console_connect', type);

			phaserload.player.console[`draw_${type}`]();
		});

		document.addEventListener('visibilitychange', (evt) => {
			log(1)(evt, document.hidden);

			if(document.hidden) return;
		});

		dom.interact.on('keyUp', ({ keyPressed }) => {
			if(game.view === 'join' && keyPressed === 'ENTER') game.joinGame();
		});

		dom.setTitle(lang.get('gameName'));
	},
	draw: function(view){
		dom.empty(dom.getElemById('wrapper'));

		dom.getElemById('wrapper').className = '';

		this.view = view = view.toLowerCase().replace(' ', '_');

		this[`draw_${view}`]();
	},
	draw_join: function(){
		this.heading = dom.createElem('div', { id: 'heading', textContent: lang.parse(`{gameName} - {${this.view}} "${game.room}"`), appendTo: dom.getElemById('wrapper') });

		const joinGameForm = dom.createElem('div', { id: 'joinGameForm', appendTo: dom.getElemById('wrapper') });
		const nameInput = dom.createElem('input', { id: 'joinGameName', placeholder: lang.get('playerName'), validation: /^.{4,32}$/, value: dom.storage.get('playerName') || '', appendTo: joinGameForm });

		dom.createElem('button', { id: 'joinGameButton', textContent: 'Join', appendTo: joinGameForm, onPointerPress: this.joinGame });
		dom.createElem('button', { id: 'lobbyButton', textContent: 'Back to Lobby', appendTo: joinGameForm, onPointerPress: dom.location.change.bind(this, '/lobby') });

		dom.validate(nameInput);

		nameInput.focus();
	},
	draw_play: function(){
		dom.getElemById('wrapper').classList.add('disappear');

		phaserload.init();
	},
	joinGame: function(){
		if(dom.getElemById('joinGameName').classList.contains('invalid')) return;

		game.playerName = dom.getElemById('joinGameName').value;

		dom.storage.set('playerName', game.playerName);

		socketClient.reply('client_join', { room: game.room, name: game.playerName });
	}
};

dom.onLoad(game.load);