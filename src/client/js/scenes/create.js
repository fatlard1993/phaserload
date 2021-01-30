import phaserload from '../phaserload';

phaserload.config.scene.create = function(){
	phaserload.scene = this;

	['ground', 'fluid', 'mobs', 'items', 'interfaces'].forEach((name) => { phaserload.groups[name] = this.add.group(); });

	phaserload.drawView();

	phaserload.initialized = true;
};