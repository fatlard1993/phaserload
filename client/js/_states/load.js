/* global Phaser, Game, Log */

Game.states.load = function(){};

Game.states.load.prototype.preload = function(){
	this.progress = Game.phaser.add.text(Game.phaser.world.centerX, Game.phaser.world.centerY - 30, '0%', { fill: 'white' });
	this.progress.anchor.setTo(0.5, 0.5);

	Game.phaser.load.onFileComplete.add(this.fileComplete, this);

	Game.phaser.load.path = '/assets/';

	Game.phaser.load.atlas('map', 'map.png', 'map.json');
};

Game.states.load.prototype.create = function(){
	Log()('load');

	// Game.phaser.renderer.setTexturePriority(['ground', 'lava', 'poisonous_gas', 'noxious_gas', 'red_monster', 'purple_monster']);

	Game.phaser.state.start('start');
};

Game.states.load.prototype.fileComplete = function(progress, cacheKey, success, totalLoaded, totalFiles){
	this.progress.text = 'Loading... '+ progress + '%\n ( tap to help )';
};