import './index.css';

import dom from 'dom';
import socketClient from 'socket-client';

import DomElem from '../../DomElem';
import phaserload from '../../../phaserload';
import audio from '../../../audio';

export default class Game {
	constructor({ room, name, className, ...rest }) {
		this.elem = new DomElem('div', { id: 'game', className: ['game', className], ...rest });

		if (!room) room = dom.location.query.get('room');
		if (!name) name = dom.location.query.get('name');

		dom.location.query.set('room', room);
		dom.location.query.set('name', name);

		if (!room || !name) return phaserload.draw('Lobby');

		socketClient.on('options', options => {
			console.log('options', options);

			phaserload.options = options;
		});

		socketClient.on('player_state', state => {
			console.log('player_state', state);

			const previousCredits = phaserload.player.credits;

			phaserload.player = Object.assign(phaserload.player, state);

			if (phaserload.scene && previousCredits !== phaserload.player.credits) {
				console.log('credits change', previousCredits - phaserload.player.credits);

				audio.playSound('coin', { loop: true, rate: 3.5 });
				setTimeout(() => {
					phaserload.scene.sound.stopByKey('coin');
				}, Math.abs(previousCredits - phaserload.player.credits) * 4);
			}
		});

		socketClient.on('invalid_move', message => {
			console.log('invalid_move', message);

			phaserload.player.midMove = false;
		});

		socketClient.on('state', state => {
			console.log('state', state);

			phaserload.state = state;

			if (!phaserload.game) phaserload.initGame();

			if (phaserload.initialized) phaserload.update();
		});

		socketClient.on('console_connect', type => {
			console.log('console_connect', type);

			phaserload.player.console[`draw_${type}`]();
		});

		socketClient.reply('client_join', { room, name });
	}

	cleanup() {
		socketClient.reply('client_disconnect', true);
		socketClient.clearEventListeners();
	}
}
