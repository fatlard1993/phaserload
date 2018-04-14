/* global Phaser, Game, WS, Log */

Game.entities.collectable = function(x, y, baseType){
	Phaser.Sprite.call(this, Game.phaser, x, y, baseType, 10);

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.collectable.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.collectable.prototype.constructor = Game.entities.collectable;

Game.entities.collectable.create = function(x, y, type){
	type = type.split('_');

	var collectable = Game.collectables.getFirstDead();

	if(collectable === null){
		collectable = Game.collectables.add(new Game.entities.collectable(x, y, type[0]));
	}
	else{
		collectable.reset(x, y);
		collectable.revive();
	}

	// collectable.frame = Game.entities.collectable.types.indexOf(type.replace('collectable_', ''));
	collectable.type = type;

	return collectable;
};

Game.entities.collectable.crush = function(pos){
	Game.collectables.forEachAlive(function(collectable){
		if(collectable.x === pos.x && collectable.y === pos.y){
			collectable.destroy();
		}
	});
};

Game.entities.collectable.collect = function(pos){
	Game.collectables.forEachAlive(function(collectable){
		if(collectable.x === pos.x && collectable.y === pos.y){
			if(Game.effects[effect](args) === -1) return;

			var animationTime = 200 + Math.ceil(Game.phaser.math.distance(Game.phaser.camera.x, Game.phaser.camera.y, collectable.x, collectable.y));

			Game.phaser.add.tween(collectable).to({ x: Game.phaser.camera.x, y: Game.phaser.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);

			setTimeout(function(){
				Game.config.map[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)][1] = 0;

				WS.send({ command: 'crush_collectable', pos: pos });

				collectable.destroy();
			}, animationTime);
		}
	});
};