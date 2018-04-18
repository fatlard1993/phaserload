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
	Game.phaser.load.spritesheet('mineral', '/assets/minerals.png', 32, 32);
	Game.phaser.load.spritesheet('item', '/assets/items.png', 32, 32);
	Game.phaser.load.spritesheet('ground', '/assets/ground.png', 64, 64);
	Game.phaser.load.spritesheet('player', '/assets/drill.png', 64, 64);
	Game.phaser.load.spritesheet('lava', '/assets/lava.png', 64, 64);
	Game.phaser.load.spritesheet('poisonous_gas', '/assets/poisonous_gas.png', 64, 64);
	Game.phaser.load.spritesheet('noxious_gas', '/assets/noxious_gas.png', 64, 64);
	Game.phaser.load.spritesheet('red_monster', '/assets/red_monster.png', 64, 64);
	Game.phaser.load.spritesheet('purple_monster', '/assets/purple_monster.png', 64, 64);
};

Game.states.load.prototype.create = function(){
	Log()('load');

	Game.phaser.state.start('start');
};

Game.states.load.prototype.fileComplete = function(progress, cacheKey, success, totalLoaded, totalFiles){
	this.progress.text = 'Loading... '+ progress + '%\n ( tap to help )';
};