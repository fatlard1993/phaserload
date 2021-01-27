import phaserload from '../phaserload';

phaserload.config.scene.create = function(){
	// var particles = this.add.particles('fireball');

	// var emitter = particles.createEmitter({
	// 	speed: 100,
	// 	scale: { start: 1, end: 0 },
	// 	blendMode: 'ADD'
	// });

	// var fireball = this.physics.add.image(30, 30, 'fireball');

	// fireball.setVelocity(100, 200);
	// fireball.setBounce(1, 1);
	// fireball.setCollideWorldBounds(true);

	// emitter.startFollow(fireball);

	phaserload.scene = this;

	['ground', 'fluid', 'mobs', 'items', 'interfaces'].forEach((name) => { phaserload.groups[name] = this.add.group(); });

	// phaserload.entities.itemSlot.init();
	// phaserload.entities.hud.init();
	// phaserload.entities.spaceco.init();

	// phaserload.updateMaxHealth();
	// phaserload.updateMaxFuel();
	// phaserload.updateBaseMoveTime();
	// phaserload.updateMaxHullSpace();
	// phaserload.updateDrillSpeedMod();

	phaserload.drawView();

	// phaserload.entities.itemSlot.setItem(1, 'teleporter');

	// phaserload.hud.open('briefing');

	phaserload.initialized = true;
};