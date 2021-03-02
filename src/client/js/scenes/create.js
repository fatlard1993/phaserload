import phaserload from '../phaserload';

phaserload.config.scene.create = function(){
	phaserload.scene = this;

	phaserload.groupNames.forEach((name) => { phaserload.groups[name] = this.add.group(); });

	phaserload.soundNames.forEach((sound) => { this.sound.add(sound); });

	phaserload.drawView();

	phaserload.initialized = true;
};