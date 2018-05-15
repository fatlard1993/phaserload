/* global Phaser, Game, Log, Cjs */

Game.entities.poisonous_gas = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'map', 'poisonous_gas_fill1');

	this.anchor.setTo(0.5, 0.5);

	var fillAnim = this.animations.add('fill', Phaser.Animation.generateFrameNames('poisonous_gas_fill', 1, 3), 3, false);
	fillAnim.onComplete.add(function(){
		this.animations.play('full');
	}, this);

	var dissipateAnim = this.animations.add('dissipate', Phaser.Animation.generateFrameNames('poisonous_gas_fill', 3, 1), 3, false);
	dissipateAnim.onComplete.add(function(){
		Game.setMapPos(Game.toGridPos(this));
	}, this);
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

	var fullAnim = poisonous_gas.animations.add('full', Phaser.Animation.generateFrameNames('poisonous_gas_full', 1, 3), 5, spreadChance === undefined);

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
		Game.setMapPos({ x: pos.x - 1, y: pos.y }, 'poisonous_gas', 'fill', null, spreadChance);
	}

	if(pos.x + 1 < Game.config.width && !surrounds.right && Cjs.chance(spreadChance)){
		Game.setMapPos({ x: pos.x + 1, y: pos.y }, 'poisonous_gas', 'fill', null, spreadChance);
	}

	if(pos.y - 1 > 0 && !surrounds.top && Cjs.chance(spreadChance)){
		Game.setMapPos({ x: pos.x, y: pos.y - 1 }, 'poisonous_gas', 'fill', null, spreadChance);
	}

	poisonous_gas.animations.play('dissipate');
};