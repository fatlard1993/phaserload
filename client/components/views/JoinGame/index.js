import './index.css';

import dom from 'dom';

import DomElem from '../../DomElem';
import PageHeader from '../../PageHeader';
import LabeledTextInput from '../../LabeledTextInput';
import Button from '../../Button';
import EditForm from '../../EditForm';

import phaserload from '../../../phaserload';

export default class JoinGame {
	constructor({ room, className, ...rest }) {
		const appendTo = new DomElem('div', { className: ['joinGame', className], ...rest });

		this.elem = appendTo;

		if (!room) room = dom.location.query.get('room');

		dom.location.query.set('room', room);

		if (!room) return phaserload.draw('Lobby');

		new PageHeader({ textContent: `Join Game - ${room}`, appendTo });
		new Button({ textContent: 'Back to Lobby', onPointerPress: () => phaserload.draw('Lobby'), appendTo });
		new Button({
			textContent: 'Join Game',
			onPointerPress: () => {
				const name = textInput.value;

				dom.storage.set('playerName', name);

				phaserload.draw('Game', { room, name });
			},
			appendTo,
		});
		const { label, textInput } = new LabeledTextInput({ label: 'Player Name', validation: /^.{3,32}$/, validate: 0 });

		new EditForm({ appendTo, appendChild: label });
	}
}
