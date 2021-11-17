import './index.css';

import dom from 'dom';
import socketClient from 'socket-client';

import DomElem from '../../DomElem';
import Button from '../../Button';
import PageHeader from '../../PageHeader';

import phaserload from '../../../phaserload';

export default class Lobby {
	constructor({ className, ...rest }) {
		const appendTo = new DomElem('div', { className: ['lobby', className], ...rest });

		this.elem = appendTo;

		new PageHeader({ textContent: 'Lobby', appendTo });
		new Button({ textContent: 'Create New Game Room', onPointerPress: () => phaserload.draw('CreateGame'), appendTo });

		const gamesList = new DomElem('ul', { className: 'gamesList', appendTo });

		socketClient.on('state', state => {
			phaserload.state.lobby = state;

			dom.empty(gamesList);

			phaserload.state.lobby.forEach(({ name, players }) => {
				new DomElem('li', {
					className: 'game',
					textContent: players,
					appendChild: new DomElem('span', { textContent: name }),
					onPointerPress: () => phaserload.draw('JoinGame', { room: name }),
					appendTo: gamesList,
				});
			});
		});

		socketClient.reply('client_join', { room: 'lobby' });

		// dom.interact.on('keyUp', ({ keyPressed }) => {
		// 	if (keyPressed === 'ENTER') {
		// 		if (document.getElementById('newGameCreateButton')) lobby.createNewGame();
		// 		else if (document.getElementById('gamesList').children.length > 1) dom.location.change(`/game?room=${document.getElementById('gamesList').children[1].children[0].textContent}`);
		// 		else if (document.getElementById('newGame')) lobby.draw('new_game');
		// 	}
		// });
	}

	cleanup() {
		socketClient.reply('client_disconnect', true);
		socketClient.clearEventListeners();
	}
}
