import phaserload from '../phaserload';
import audio from '../audio';

export default function () {
	phaserload.scene = this;

	phaserload.groupNames.forEach(name => {
		phaserload.groups[name] = this.add.group();
	});

	audio.audioNames.forEach(sound => {
		this.sound.add(sound);
	});

	audio.playMusic();

	phaserload.drawView();

	phaserload.initialized = true;
}
