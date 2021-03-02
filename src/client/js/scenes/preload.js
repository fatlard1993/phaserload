import phaserload from '../phaserload';

phaserload.config.scene.preload = function(){
	this.load.image('fireball', 'fireball.png');

	this.load.atlas('map', 'map.png', 'map.json');

	phaserload.soundNames.forEach((sound) => { this.load.audio(sound, `audio/${sound}.wav`); });
};