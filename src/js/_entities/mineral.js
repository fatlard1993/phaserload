/* global Phaser, Game, Socket, Log */

Game.entities.mineral = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'mineral', 6);

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.mineral.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.mineral.prototype.constructor = Game.entities.mineral;

Game.entities.mineral.types = ['green', 'red', 'blue', 'purple', 'teal', 'unknown'];

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

	return mineral;
};

Game.entities.mineral.crush = function(pos){
	Game.minerals.forEachAlive(function(mineral){
		if(mineral.x === pos.x && mineral.y === pos.y){
			mineral.kill();
		}
	});
};

Game.entities.mineral.collect = function(pos){
	var mineralWeight = 0.08;

	if(Game.player.hull.space < mineralWeight) return;

	Game.minerals.forEachAlive(function(mineral){
		if(mineral.x === pos.x && mineral.y === pos.y){
			Game.player.hull[mineral.type] = Game.player.hull[mineral.type] !== undefined ? Game.player.hull[mineral.type] : 0;

			Game.player.hull[mineral.type]++;

			var animationTime = 200 + Math.ceil(Game.phaser.math.distance(Game.phaser.camera.x, Game.phaser.camera.y, mineral.x, mineral.y));

			Game.phaser.add.tween(mineral).to({ x: Game.phaser.camera.x, y: Game.phaser.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);

			setTimeout(function(){
				Game.player.hull.space -= mineralWeight;

				Game.config.map[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)][1] = 0;

				Socket.active.send(JSON.stringify({ command: 'crush_mineral', pos: pos }));

				mineral.kill();
			}, animationTime);
		}
	});
};