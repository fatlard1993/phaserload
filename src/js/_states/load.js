/* global Phaser, Game, Log */

Game.states.load = function(){};

Game.states.load.prototype.preload = function(){
	Game.phaser.stage.disableVisibilityChange = true;

	this.progress = Game.phaser.add.text(Game.phaser.world.centerX, Game.phaser.world.centerY - 30, '0%', { fill: 'white' });
	this.progress.anchor.setTo(0.5, 0.5);

	Game.phaser.load.onFileComplete.add(this.fileComplete, this);

	Game.phaser.load.spritesheet('hud', '/assets/hud.png', 320, 256);
	Game.phaser.load.spritesheet('itemSlot', '/assets/itemSlot.png', 64, 64);
	Game.phaser.load.spritesheet('spaceco', '/assets/spaceco.png', 704, 448);
	Game.phaser.load.spritesheet('teleporter', '/assets/teleporter.png', 32, 32);
	Game.phaser.load.spritesheet('responder', '/assets/responder.png', 32, 32);
	Game.phaser.load.spritesheet('responder_teleporter', '/assets/responder_teleporter.png', 32, 32);
	Game.phaser.load.spritesheet('repair', '/assets/repair.png', 32, 32);
	Game.phaser.load.spritesheet('tombstone', '/assets/tombstone.png', 32, 32);
	Game.phaser.load.spritesheet('repair_nanites', '/assets/repair_nanites.png', 32, 32);
	Game.phaser.load.spritesheet('detonator', '/assets/detonator.png', 32, 32);
	Game.phaser.load.spritesheet('explosive', '/assets/explosives.png', 32, 32);
	Game.phaser.load.spritesheet('fuel', '/assets/fuel.png', 32, 32);
	Game.phaser.load.spritesheet('upgrade', '/assets/upgrades.png', 32, 32);
	Game.phaser.load.spritesheet('mineral', '/assets/minerals.png', 32, 32);
	Game.phaser.load.spritesheet('ground', '/assets/ground.png', 64, 64);
	Game.phaser.load.spritesheet('drill', '/assets/drill.png', 64, 64);
	Game.phaser.load.spritesheet('lava', '/assets/lava.png', 64, 64);
	Game.phaser.load.spritesheet('gas', '/assets/gas.png', 64, 64);
	Game.phaser.load.spritesheet('monster', '/assets/monster.png', 64, 64);
};

Game.states.load.prototype.create = function(){
	Log()('load');

	Game.phaser.state.start('start');
};

Game.states.load.prototype.fileComplete = function(progress, cacheKey, success, totalLoaded, totalFiles){
	this.progress.text = 'Loading... '+ progress + '%';
};