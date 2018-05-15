/* global Phaser, Game, Log */

Game.states.load = function(){};

Game.states.load.prototype.preload = function(){
	this.progress = Game.phaser.add.text(Game.phaser.world.centerX, Game.phaser.world.centerY - 30, '0%', { fill: 'white' });
	this.progress.anchor.setTo(0.5, 0.5);

	Game.phaser.load.onFileComplete.add(this.fileComplete, this);

	Game.phaser.load.path = '/assets/';

	Game.phaser.load.atlas('map', 'map.png', 'map.json');

	// Game.phaser.load.spritesheet('spaceco', 'spaceco.png', 704, 448);
	// Game.phaser.load.spritesheet('player', 'drill.png', 64, 64);
	// Game.phaser.load.spritesheet('hud', 'hud.png', 320, 256);
	// Game.phaser.load.spritesheet('itemSlot', 'itemSlot.png', 64, 64);
	// Game.phaser.load.spritesheet('mineral', 'minerals.png', 32, 32);
	// Game.phaser.load.spritesheet('item', 'items.png', 32, 32);
	// Game.phaser.load.spritesheet('ground', 'ground.png', 64, 64);
	// Game.phaser.load.spritesheet('lava', 'lava.png', 64, 64);
	// Game.phaser.load.spritesheet('poisonous_gas', 'poisonous_gas.png', 64, 64);
	// Game.phaser.load.spritesheet('noxious_gas', 'noxious_gas.png', 64, 64);
	// Game.phaser.load.spritesheet('red_monster', 'red_monster.png', 64, 64);
	// Game.phaser.load.spritesheet('purple_monster', 'purple_monster.png', 64, 64);
};

Game.states.load.prototype.create = function(){
	Log()('load');

	// Game.phaser.renderer.setTexturePriority(['ground', 'lava', 'poisonous_gas', 'noxious_gas', 'red_monster', 'purple_monster']);

	Game.phaser.state.start('start');
};

Game.states.load.prototype.fileComplete = function(progress, cacheKey, success, totalLoaded, totalFiles){
	this.progress.text = 'Loading... '+ progress + '%\n ( tap to help )';
};