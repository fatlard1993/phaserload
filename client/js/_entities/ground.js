/* global Phaser, Game, Cjs */

Game.entities.ground = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'ground');

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.ground.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.ground.prototype.constructor = Game.entities.ground;

Game.entities.ground.types = ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'];

Game.entities.ground.create = function(x, y, type){
	var ground = Game.ground.add(new Game.entities.ground(x, y));

	Game.config.map[x][y].ground.name = type;

	type = type.replace('ground_', '');

	Game.config.map[x][y].ground.base = 'ground';
	Game.config.map[x][y].ground.variant = type;
	Game.config.map[x][y].ground.sprite = ground;

	ground.frameMod = Game.entities.ground.types.indexOf(type) * 4;
	ground.frame = 0 + ground.frameMod;

	var crushAnimation = ground.animations.add('crush', [0 + ground.frameMod, 1 + ground.frameMod, 2 + ground.frameMod, 3 + ground.frameMod], 10, false);
	crushAnimation.onComplete.add(function(){
		ground.destroy();
	}, ground);

	return ground;
};

Game.entities.ground.dig = function(pos){
	var ground = Game.mapPos(pos).ground;

	// Log()('dig: ', type, pos);
	if(!ground.name || ground.base !== 'ground') return;

	var blockActions = Game.config.groundEffects[ground.variant];

	if(blockActions && blockActions.includes('impenetrable')) return;

	if(blockActions) Game.applyEffects(blockActions, pos);

	// var surrounds = Game.getSurrounds(pos, { left: 1, top: 1, right: 1, bottom: 1 });

	// Game.releaseSurrounds(pos, surrounds, Game.config.densities[ground.variant]);

	Game.setMapPos(pos);

	var isMineral = false;

	var drillPart = Game.player.configuration.drill.split(':~:');

	if(drillPart[0].includes('precision')) isMineral = Cjs.chance(5 * parseInt(drillPart[0].split('_')[1]));

	Game.effects.getHullItem((isMineral ? 'mineral_' : 'ground_') + ground.variant);
};