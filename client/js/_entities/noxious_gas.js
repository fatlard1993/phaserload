/* global Phaser, Game, Log, Cjs */

Game.entities.noxious_gas = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'noxious_gas');

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.noxious_gas.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.noxious_gas.prototype.constructor = Game.entities.noxious_gas;

Game.entities.noxious_gas.create = function(x, y, isNew, spawnChance, spreadChance){
	if(isNew && spawnChance !== undefined && !Cjs.chance(spawnChance)) return;

	var noxious_gas = Game.noxious_gas.getFirstDead();

	var fillAnim, dissipateAnim, fullAnim;

	if(!noxious_gas){
		noxious_gas = Game.noxious_gas.add(new Game.entities.noxious_gas(x, y));
	}
	else{
		noxious_gas.reset(Game.toPx(x), Game.toPx(y));
		noxious_gas.revive();
		noxious_gas.animations.stop();
	}

	fillAnim = noxious_gas.animations.add('fill', [2, 1, 0], 3, false);
	fillAnim.onComplete.add(function(){
		noxious_gas.animations.play('full');
	}, noxious_gas);

	fullAnim = noxious_gas.animations.add('full', [3, 4, 5], 6, false);

	dissipateAnim = noxious_gas.animations.add('dissipate', [0, 1, 2], 3, false);
	dissipateAnim.killOnComplete = true;

	if(isNew){
		noxious_gas.spreadChance = spreadChance !== undefined ? spreadChance : spawnChance !== undefined ? spawnChance - Cjs.randInt(5, 17) : 100;

		fullAnim.onComplete.add(function(){
			Game.entities.noxious_gas.spread(noxious_gas);
		}, noxious_gas);

		dissipateAnim.onComplete.add(function(){
			Game.setMapPos({ x: noxious_gas.x, y: noxious_gas.y });
		}, noxious_gas);

		Game.setMapPos({ x: x, y: y }, 'noxious_gas', 'fill');

		noxious_gas.animations.play('fill');
	}

	else{
		fullAnim.onComplete.add(function(){
			noxious_gas.animations.play('dissipate');
		}, noxious_gas);

		noxious_gas.animations.play('full');
	}

	Game.config.map[x][y].ground.name = 'noxious_gas';
	Game.config.map[x][y].ground.base = 'gas';
	Game.config.map[x][y].ground.variant = 'noxious';
	Game.config.map[x][y].ground.sprite = noxious_gas;

	return noxious_gas;
};

Game.entities.noxious_gas.spread = function(noxious_gas){
	var gridPos = Game.toGridPos(noxious_gas);

	var surrounds = Game.getSurrounds(gridPos, { left: 1, top: 1, right: 1, bottom: 1 });

	if(gridPos.x - 1 > 0 && (surrounds.left === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.left])){
		Game.entities.noxious_gas.create(gridPos.x - 1, gridPos.y, 1, noxious_gas.spreadChance);
	}

	if(gridPos.x + 1 < Game.config.width && (surrounds.right === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.right])){
		Game.entities.noxious_gas.create(gridPos.x + 1, gridPos.y, 1, noxious_gas.spreadChance);
	}

	if(gridPos.y - 1 > 0 && (surrounds.top === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.top])){
		if(Cjs.chance(30)) Game.entities.noxious_gas.create(gridPos.x, gridPos.y - 1, 1, noxious_gas.spreadChance);
	}

	if(gridPos.y + 1 > 0 && (surrounds.bottom === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.bottom])){
		Game.entities.noxious_gas.create(gridPos.x, gridPos.y + 1, 1, noxious_gas.spreadChance);
	}

	noxious_gas.animations.play('dissipate');
};