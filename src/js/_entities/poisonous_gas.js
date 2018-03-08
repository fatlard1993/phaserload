/* global Phaser, Game, Log */

Game.entities.poisonous_gas = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'poisonous_gas');

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.poisonous_gas.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.poisonous_gas.prototype.constructor = Game.entities.poisonous_gas;

Game.entities.poisonous_gas.create = function(x, y, isNew, spawnChance, spreadChance){
	if(isNew && spawnChance !== undefined && !Game.chance(spawnChance)) return;

	var poisonous_gas = Game.poisonous_gas.getFirstDead();

	var fillingAnim, dissipateAnim, fullAnim;

	if(!poisonous_gas){
		poisonous_gas = Game.poisonous_gas.add(new Game.entities.poisonous_gas(x, y));
	}
	else{
		poisonous_gas.reset(x, y);
		poisonous_gas.revive();
		poisonous_gas.animations.stop();
	}

	fillingAnim = poisonous_gas.animations.add('filling', [2, 1, 0], 3, false);
	fillingAnim.onComplete.add(function(){
		poisonous_gas.animations.play('full');
	}, poisonous_gas);

	fullAnim = poisonous_gas.animations.add('full', [3, 4, 5], 6, false);

	dissipateAnim = poisonous_gas.animations.add('dissipate', [0, 1, 2], 3, false);
	dissipateAnim.killOnComplete = true;

	poisonous_gas.animations.add('trapped', [3, 4, 5], 12, true);

	if(isNew){
		poisonous_gas.spreadChance = spreadChance !== undefined ? spreadChance : spawnChance !== undefined ? spawnChance - Game.rand(0, 9) : 100;

		fullAnim.onComplete.add(function(){
			Game.entities.poisonous_gas.spread(null, null, poisonous_gas);
		}, poisonous_gas);

		dissipateAnim.onComplete.add(function(){
			Game.setMapPos({ x: poisonous_gas.x, y: poisonous_gas.y }, -1);
		}, poisonous_gas);

		Game.setMapPos({ x: x, y: y }, Game.mapNames.indexOf('poisonous_gas'), null, 'filling');

		poisonous_gas.animations.play('filling');
	}

	else{
		fullAnim.onComplete.add(function(){
			poisonous_gas.animations.play('dissipate');
		}, poisonous_gas);

		poisonous_gas.animations.play('trapped');
	}

	return poisonous_gas;
};

Game.entities.poisonous_gas.find = function(x, y, cb){
	Game.poisonous_gas.forEachAlive(function(poisonous_gas){
		if(poisonous_gas.x === x && poisonous_gas.y === y) cb(poisonous_gas, poisonous_gas, poisonous_gas);
	});
};

Game.entities.poisonous_gas.spread = function(x, y, poisonous_gas){
	if(poisonous_gas){
		var gridPos = {
			x: Game.toGridPos(poisonous_gas.x),
			y: Game.toGridPos(poisonous_gas.y)
		};

		var surrounds = {
			left: Game.mapPosName(gridPos.x - 1, gridPos.y),
			right: Game.mapPosName(gridPos.x + 1, gridPos.y),
			top: Game.mapPosName(gridPos.x, gridPos.y - 1)
		};

		if(gridPos.x - 1 > 0 && (!surrounds.left || !!{ monster: 1 }[surrounds.left])){
			Game.entities.poisonous_gas.create(poisonous_gas.x - Game.blockPx, poisonous_gas.y, 1, poisonous_gas.spreadChance);
		}

		if(gridPos.x + 1 < Game.config.width && (!surrounds.right || !!{ monster: 1 }[surrounds.right])){
			Game.entities.poisonous_gas.create(poisonous_gas.x + Game.blockPx, poisonous_gas.y, 1, poisonous_gas.spreadChance);
		}

		if(gridPos.y - 1 > 0 && (!surrounds.top || !!{ monster: 1 }[surrounds.top])){
			Game.entities.poisonous_gas.create(poisonous_gas.x, poisonous_gas.y - Game.blockPx, 1, poisonous_gas.spreadChance);
		}

		poisonous_gas.animations.play('dissipate');
	}

	else{
		Game.entities.poisonous_gas.find(x, y, Game.entities.poisonous_gas.spread);
	}
};