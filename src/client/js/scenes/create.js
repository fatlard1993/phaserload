import phaserload from '../phaserload';

phaserload.config.scene.create = function(){
	phaserload.scene = this;

	phaserload.groupNames.forEach((name) => { phaserload.groups[name] = this.add.group(); });

	phaserload.audioNames.forEach((sound) => { this.sound.add(sound); });

	phaserload.playMusic();

	phaserload.drawView();

	phaserload.initialized = true;
};