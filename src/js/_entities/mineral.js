/* global Phaser, Game, Log */

Game.entities.mineral = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'mineral', 6);

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.mineral.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.mineral.prototype.constructor = Game.entities.mineral;

Game.entities.mineral.types = ['green', 'red', 'blue', 'purple', 'teal', '???'];

Game.entities.mineral.create = function(x, y, type){
	var mineral = Game.minerals.getFirstDead();

	if(mineral === null){
		mineral = Game.minerals.add(new Game.entities.mineral(x, y));
	}
	else{
		mineral.reset(x, y);
		mineral.revive();
	}

	mineral.frame = Game.entities.mineral.types.indexOf(type.replace('mineral_', ''));
	mineral.type = type;

	var gridPos = {
		x: Game.toGridPos(x),
		y: Game.toGridPos(y)
	};

	return mineral;
};