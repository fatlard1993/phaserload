import phaserload from '../phaserload';

phaserload.config.scene.preload = function(){
	this.load.image('fireball', 'fireball.png');
	this.load.atlas('map', 'map.png', 'map.json');
};