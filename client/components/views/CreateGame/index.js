import './index.css';

import socketClient from 'socket-client';

import DomElem from '../../DomElem';
import PageHeader from '../../PageHeader';
import Button from '../../Button';
import EditForm from '../../EditForm';
import LabeledTextInput from '../../LabeledTextInput';
import LabeledNumberInput from '../../LabeledNumberInput';

import phaserload from '../../../phaserload';

export default class CreateGame {
	constructor({ className, ...rest }) {
		const appendTo = new DomElem('div', { className: ['createGame', className], ...rest });

		this.elem = appendTo;

		socketClient.on('create_game', () => phaserload.draw('Lobby'));

		new PageHeader({ textContent: 'Create Game', appendTo });
		new Button({ textContent: 'Back to Lobby', onPointerPress: () => phaserload.draw('Lobby'), appendTo });
		new Button({
			textContent: 'Create Game',
			onPointerPress: () => {
				if (!document.querySelectorAll('.invalid').length) {
					const startingWorld = worldInput.value;
					const mode = modeInput.value;
					const worldPack = worldPackInput.value;

					const options = {
						name: nameInput.value || 'rand',
						startingWorldIndex: startingWorld.length ? parseInt(startingWorld) : 'rand',
						mode: mode.length ? mode : 'default',
						worldPack: worldPack.length ? worldPack : 'default',
					};

					phaserload.log()('Create game', options);

					socketClient.reply('create_game', options);
				}
			},
			appendTo,
		});

		const { label: nameLabel, textInput: nameInput } = new LabeledTextInput({ label: 'Room Name', placeholder: 'rand', validation: /^.{4,32}$|(^(?![\s\S]))/, validate: 0 });
		const { label: worldLabel, numberInput: worldInput } = new LabeledNumberInput({
			label: 'Starting World Index',
			placeholder: 'rand',
			validation: /(^([0-9]|10)$)|(^(?![\s\S]))/,
			validate: 0,
		});
		const { label: modeLabel, textInput: modeInput } = new LabeledTextInput({ label: 'Mode', placeholder: 'default', validation: /^.{4,32}$|(^(?![\s\S]))/, validate: 0 });
		const { label: worldPackLabel, textInput: worldPackInput } = new LabeledTextInput({ label: 'World Pack', placeholder: 'default', validation: /^.{4,32}$|(^(?![\s\S]))/, validate: 0 });

		new EditForm({ appendTo, appendChildren: [nameLabel, worldLabel, modeLabel, worldPackLabel] });

		nameInput.focus();
	}

	cleanup() {
		socketClient.reply('client_disconnect', true);
		socketClient.clearEventListeners();
	}
}
