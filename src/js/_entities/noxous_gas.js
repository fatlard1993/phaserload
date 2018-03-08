/* global Phaser, Game, Log */

Game.entities.noxious_gas = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'noxious_gas');

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.noxious_gas.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.noxious_gas.prototype.constructor = Game.entities.noxious_gas;

Game.entities.noxious_gas.create = function(x, y, isNew, spawnChance, spreadChance){
	if(isNew && spawnChance !== undefined && !Game.chance(spawnChance)) return;

	var noxious_gas = Game.noxious_gas.getFirstDead();

	var fillingAnim, dissipateAnim, fullAnim;

	if(!noxious_gas){
		noxious_gas = Game.noxious_gas.add(new Game.entities.noxious_gas(x, y));
	}
	else{
		noxious_gas.reset(x, y);
		noxious_gas.revive();
		noxious_gas.animations.stop();
	}

	fillingAnim = noxious_gas.animations.add('filling', [2, 1, 0], 3, false);
	fillingAnim.onComplete.add(function(){
		noxious_gas.animations.play('full');
	}, noxious_gas);

	fullAnim = noxious_gas.animations.add('full', [3, 4, 5], 6, false);

	dissipateAnim = noxious_gas.animations.add('dissipate', [0, 1, 2], 3, false);
	dissipateAnim.killOnComplete = true;

	noxious_gas.animations.add('trapped', [3, 4, 5], 12, true);

	if(isNew){
		noxious_gas.spreadChance = spreadChance !== undefined ? spreadChance : spawnChance !== undefined ? spawnChance - Game.rand(5, 17) : 100;

		fullAnim.onComplete.add(function(){
			Game.entities.noxious_gas.spread(null, null, noxious_gas);
		}, noxious_gas);

		dissipateAnim.onComplete.add(function(){
			Game.setMapPos({ x: noxious_gas.x, y: noxious_gas.y }, -1);
		}, noxious_gas);

		Game.setMapPos({ x: x, y: y }, Game.mapNames.indexOf('noxious_gas'), null, 'filling');

		noxious_gas.animations.play('filling');
	}

	else{
		fullAnim.onComplete.add(function(){
			noxious_gas.animations.play('dissipate');
		}, noxious_gas);

		noxious_gas.animations.play('trapped');
	}

	return noxious_gas;
};

Game.entities.noxious_gas.find = function(x, y, cb){
	Game.noxious_gas.forEachAlive(function(noxious_gas){
		if(noxious_gas.x === x && noxious_gas.y === y) cb(noxious_gas, noxious_gas, noxious_gas);
	});
};

Game.entities.noxious_gas.spread = function(x, y, noxious_gas){
	if(noxious_gas){
		var gridPos = {
			x: Game.toGridPos(noxious_gas.x),
			y: Game.toGridPos(noxious_gas.y)
		};

		var surrounds = {
			left: Game.mapPosName(gridPos.x - 1, gridPos.y),
			right: Game.mapPosName(gridPos.x + 1, gridPos.y),
			top: Game.mapPosName(gridPos.x, gridPos.y - 1),
			bottom: Game.mapPosName(gridPos.x, gridPos.y + 1)
		};

		if(gridPos.x - 1 > 0 && (!surrounds.left || !!{ monster: 1 }[surrounds.left])){
			Game.entities.noxious_gas.create(noxious_gas.x - Game.blockPx, noxious_gas.y, 1, noxious_gas.spreadChance);
		}

		if(gridPos.x + 1 < Game.config.width && (!surrounds.right || !!{ monster: 1 }[surrounds.right])){
			Game.entities.noxious_gas.create(noxious_gas.x + Game.blockPx, noxious_gas.y, 1, noxious_gas.spreadChance);
		}

		if(gridPos.y - 1 > 0 && (!surrounds.top || !!{ monster: 1 }[surrounds.top])){
			if(Game.chance(30)) Game.entities.noxious_gas.create(noxious_gas.x, noxious_gas.y - Game.blockPx, 1, noxious_gas.spreadChance);
		}

		if(gridPos.y + 1 > 0 && (!surrounds.bottom || !!{ monster: 1 }[surrounds.bottom])){
			Game.entities.noxious_gas.create(noxious_gas.x, noxious_gas.y + Game.blockPx, 1, noxious_gas.spreadChance);
		}

		noxious_gas.animations.play('dissipate');
	}

	else{
		Game.entities.noxious_gas.find(x, y, Game.entities.noxious_gas.spread);
	}
};