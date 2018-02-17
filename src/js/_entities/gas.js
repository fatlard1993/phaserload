/* global Phaser, Game, Log */

Game.entities.gas = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'gas');

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.gas.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.gas.prototype.constructor = Game.entities.gas;

Game.entities.gas.create = function(x, y, isNew, spawnChance, spreadChance){
	if(isNew && spawnChance !== undefined && !Game.chance(spawnChance)) return;

	var gas = Game.gas.getFirstDead();

	if(!gas){
		gas = Game.gas.add(new Game.entities.gas(x, y));

		var fillingAnim = gas.animations.add('filling', [2, 1, 0], 3, false);
		fillingAnim.onComplete.add(function(){
			gas.play('full');

			Game.entities.gas.spread(gas.x, gas.y);
		}, gas);

		var dissipateAnim = gas.animations.add('dissipate', [0, 1, 2], 3, false);
		dissipateAnim.onComplete.add(function(){
			gas.kill();

			Game.setMapPos({ x: gas.x, y: gas.y }, -1);
		}, gas);

		var fullAnim = gas.animations.add('full', [3, 4, 5], 6, false);
		fullAnim.onComplete.add(function(){
			gas.play('dissipate');
		}, gas);

		gas.animations.add('trapped', [3, 4, 5], 12, true);
	}
	else{
		gas.reset(x, y);
		gas.revive();
		gas.animations.stop();
	}

	if(isNew){
		Game.setMapPos({ x: x, y: y }, Game.mapNames.indexOf('gas'));

		gas.spreadChance = spreadChance !== undefined ? spreadChance : spawnChance !== undefined ? spawnChance - Game.rand(0, 9) : 100;

		gas.animations.play('filling');
	}
	else{
		gas.animations.play('trapped');
	}

	return gas;
};

Game.entities.gas.spread = function(x, y){
	Game.gas.forEachAlive(function(gas){
		if(gas.x === x && gas.y === y){
			var gridPos = {
				x: Game.toGridPos(gas.x),
				y: Game.toGridPos(gas.y)
			};

			var surrounds = {
				left: Game.mapPosName(gridPos.x - 1, gridPos.y),
				right: Game.mapPosName(gridPos.x + 1, gridPos.y),
				top: Game.mapPosName(gridPos.x, gridPos.y - 1)
			};

			if(gridPos.x - 1 > 0 && (!surrounds.left || ['player1', 'monster'].includes(surrounds.left))){
				Game.entities.gas.create(gas.x - Game.blockPx, gas.y, 1, gas.spreadChance);
			}

			if(gridPos.x + 1 < Game.config.width && (!surrounds.right || ['player1', 'monster'].includes(surrounds.right))){
				Game.entities.gas.create(gas.x + Game.blockPx, gas.y, 1, gas.spreadChance);
			}

			if(gridPos.y - 1 > 0 && (!surrounds.top || ['player1', 'monster'].includes(surrounds.top))){
				Game.entities.gas.create(gas.x, gas.y - Game.blockPx, 1, gas.spreadChance);
			}

			gas.play('dissipate');
		}
	});
};