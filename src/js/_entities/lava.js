/* global Phaser, Game, Log */

Game.entities.lava = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'lava');

	this.anchor.setTo(0.5, 0.5);

	return this;
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

Game.entities.lava.create = function(x, y, isNew){
	var lava = Game.lava.getFirstDead();
	var fillingAnim;

	if(!lava){
		lava = Game.lava.add(new Game.entities.lava(x, y));

		lava.animations.add('full', [3, 4, 5], 6, true);
	}

	else{
		lava.reset(x, y);
		lava.revive();
		lava.animations.stop();
	}

	if(isNew){
		fillingAnim = lava.animations.add('filling', [0, 1, 2], 3, false);
		fillingAnim.onComplete.add(function(){
			lava.play('full');

			Game.entities.lava.spread(null, null, lava);
		}, lava);

		lava.animations.play('filling');

		Game.setMapPos({ x: x, y: y }, Game.mapNames.indexOf('lava'), null, 'filling');
	}

	else{
		fillingAnim = lava.animations.add('filling', [0, 1, 2], 3, false);
		fillingAnim.onComplete.add(function(){
			lava.play('full');
		}, lava);

		lava.animations.play('full');
	}

	return lava;
};

Game.entities.lava.find = function(x, y, cb){
	Game.lava.forEachAlive(function(lava){
		if(lava.x === x && lava.y === y) cb(lava, lava, lava);
	});
};

Game.entities.lava.spread = function(x, y, lava){
	if(lava){
		if(lava.x === x && lava.y === y){
			var gridPos = {
				x: Game.toGridPos(lava.x),
				y: Game.toGridPos(lava.y)
			};

			var surrounds = {
				left: Game.mapPosName(gridPos.x - 1, gridPos.y),
				right: Game.mapPosName(gridPos.x + 1, gridPos.y),
				bottom: Game.mapPosName(gridPos.x, gridPos.y + 1)
			};

			if(gridPos.x - 1 >= 0 && (!surrounds.left || ['monster'].includes(surrounds.left))){
				Game.entities.lava.create(x - Game.blockPx, y, 1);
			}

			if(gridPos.x + 1 < Game.config.width && (!surrounds.right || ['monster'].includes(surrounds.right))){
				Game.entities.lava.create(x + Game.blockPx, y, 1);
			}

			if(gridPos.y + 1 < Game.config.depth - 2 && (!surrounds.bottom || ['monster'].includes(surrounds.bottom))){
				Game.entities.lava.create(x, y + Game.blockPx, 1);
			}
		}
	}

	else Game.entities.lava.find(x, y, Game.entities.lava.spread);
};