import Phaser from 'phaser';
import { jsUtil } from 'js-util';

import phaserload from './phaserload';

const audio = {
	get audioNames() {
		return phaserload.soundNames.concat(
			phaserload.musicNames.map(name => {
				return `music/${name}`;
			}),
		);
	},
	playSound: function (name, options = {}) {
		phaserload.scene.sound.play(name, Object.assign({ volume: phaserload.config.volume.sounds }, options));
	},
	playMusic: function (name) {
		if (!name) name = jsUtil.randFromArr(phaserload.musicNames);

		name = `music/${name}`;

		const options = { volume: phaserload.config.volume.music };

		if (phaserload.scene.sound.locked) phaserload.scene.sound.once(Phaser.Sound.Events.UNLOCKED, audio.playMusic(...arguments));

		if (audio.music) audio.music.stop();

		audio.music = phaserload.scene.sound.add(name, options);

		audio.music.once('complete', () => {
			audio.playMusic();
		});

		console.log('playMusic', name, audio.music);

		if (audio.music) audio.music.play();
	},
};

export default audio;
