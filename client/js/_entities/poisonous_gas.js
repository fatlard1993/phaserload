/* global Phaser, Game, Log, Cjs */

Game.entities.poisonous_gas = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'poisonous_gas');

	this.anchor.setTo(0.5, 0.5);

	var fillAnim = this.animations.add('fill', [2, 1, 0], 3, false);
	fillAnim.onComplete.add(function(){
		this.animations.play('full');
	}, this);

	var dissipateAnim = this.animations.add('dissipate', [0, 1, 2], 3, false);
	dissipateAnim.killOnComplete = true;
};

Game.entities.poisonous_gas.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.poisonous_gas.prototype.constructor = Game.entities.poisonous_gas;

Game.entities.poisonous_gas.create = function(x, y, spreadChance){
	var poisonous_gas = Game.poisonous_gas.getFirstDead();

	if(!poisonous_gas){
		poisonous_gas = Game.poisonous_gas.add(new Game.entities.poisonous_gas(x, y));
	}
	else{
		poisonous_gas.reset(Game.toPx(x), Game.toPx(y));
		poisonous_gas.revive();
		poisonous_gas.animations.stop();
		poisonous_gas.animations.getAnimation('full').destroy();
	}

	var fullAnim = poisonous_gas.animations.add('full', [3, 4, 5], 5, spreadChance === undefined);

	if(spreadChance !== undefined){
		poisonous_gas.spreadChance = spreadChance - Cjs.randInt(5, 20);

		fullAnim.onComplete.add(function(){
			Game.entities.poisonous_gas.spread(poisonous_gas);
		}, poisonous_gas);
	}

	else{
		poisonous_gas.spreadChance = 100;

		poisonous_gas.animations.play('full');
	}

	Game.config.map[x][y].ground.name = 'poisonous_gas';
	Game.config.map[x][y].ground.base = 'gas';
	Game.config.map[x][y].ground.variant = 'poisonous';
	Game.config.map[x][y].ground.sprite = poisonous_gas;

	return poisonous_gas;
};

Game.entities.poisonous_gas.spread = function(poisonous_gas){
	var pos = Game.toGridPos(poisonous_gas);
	var spreadChance = poisonous_gas.spreadChance;

	var surrounds = Game.getSurrounds(pos, { left: 1, top: 1, right: 1 }, 'ground');

	if(pos.x - 1 > 0 && !surrounds.left && Cjs.chance(spreadChance)){
		Game.entities.poisonous_gas.create(pos.x - 1, pos.y, spreadChance);
	}

	if(pos.x + 1 < Game.config.width && !surrounds.right && Cjs.chance(spreadChance)){
		Game.entities.poisonous_gas.create(pos.x + 1, pos.y, spreadChance);
	}

	if(pos.y - 1 > 0 && !surrounds.top && Cjs.chance(spreadChance)){
		Game.entities.poisonous_gas.create(pos.x, pos.y - 1, spreadChance);
	}

	poisonous_gas.animations.play('dissipate');
};