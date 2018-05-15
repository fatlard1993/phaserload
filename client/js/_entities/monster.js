/* global Phaser, Game, Log, Cjs */

Game.entities.monster = function(x, y, type){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'map', type +'_monster_sleep1');

	this.anchor.setTo(0.5, 0.5);

	this.animations.add('sleep', Phaser.Animation.generateFrameNames(type +'_monster_sleep', 1, 3), Cjs.randInt(2, 6), true);
	this.animations.add('awake', Phaser.Animation.generateFrameNames(type +'_monster_awake', 1, 3), Cjs.randInt(6, 12), true);
};

Game.entities.monster.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.monster.prototype.constructor = Game.entities.monster;

Game.entities.monster.create = function(x, y, type){
	var monster = Game.monsters.getFirstDead();

	if(monster === null){
		monster = Game.monsters.add(new Game.entities.monster(x, y, type));
	}
	else{
		monster.reset(Game.toPx(x), Game.toPx(y));
		monster.revive();
	}

	monster.type = type;

	monster.animations.play('sleep');

	Game.config.map[x][y].ground.name = type +'_monster';
	Game.config.map[x][y].ground.base = 'monster';
	Game.config.map[x][y].ground.variant = type;
	Game.config.map[x][y].ground.sprite = monster;

	return monster;
};

Game.entities.monster.prototype.update = function(){
	if(!this.alive || Game.phaser.tweens.isTweening(this)) return;

	var gridPos = Game.toGridPos(this);

	var aggroDistance = Game.toPx(this.type === 'red' ? 8 : 4);

	if(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, this.x, this.y) > aggroDistance) return;

	var moving;

	var xDiff = this.x - Game.player.sprite.x;
	var yDiff = this.y - Game.player.sprite.y;

	var xDirection = xDiff > 0 ? 'left' : 'right';
	var yDirection = yDiff > 0 ? 'up' : 'down';

	// var wantToMove = Math.abs(xDiff) > Math.abs(yDiff) ? xDirection : yDirection;

	var surrounds = Game.getSurrounds(gridPos, { left: 1, top: 1, right: 1, bottom: 1 });

	var canMove = {};

	if(gridPos.x - 1 > 0 && (surrounds.left === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.left])){
		canMove.left = 1;
	}

	if(gridPos.x + 1 < Game.config.width && (surrounds.right === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.right])){
		canMove.right = 1;
	}

	if(gridPos.y - 1 > 0 && (surrounds.top === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.top])){
		canMove.up = 1;
	}

	if(gridPos.y + 1 > 0 && (surrounds.bottom === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.bottom])){
		canMove.down = 1;
	}

	if(yDiff !== 0 && yDirection === 'up' && canMove.up){
		moving = { x: this.x, y: this.y - Game.blockPx };
	}

	else if(yDiff !== 0 && yDirection === 'down' && canMove.down){
		moving = { x: this.x, y: this.y + Game.blockPx };
	}

	else if(xDirection === 'left' && canMove.left){
		moving = { x: this.x - Game.blockPx, y: this.y };
	}

	else if(xDirection === 'right' && canMove.right){
		moving = { x: this.x + Game.blockPx, y: this.y };
	}

	if(!moving) return this.animations.play('sleep');

	this.justMoved = this.x !== moving.x ? (this.x - moving.x > 0 ? 'left' : 'right') : this.y !== moving.y > 0 ? 'up' : 'down';

	var moveDelay = 300;
	var moveSpeed = this.type === 'red' ? 400 : 200;

	if(!this.hadFirstMove){
		this.hadFirstMove = 1;
		moveDelay += 1000;
	}

	var newGridPos = Game.toGridPos(moving);

	var monsterCollision = Game.mapPos(newGridPos).ground.name;

	if(monsterCollision && monsterCollision !== 'red_monster' && monsterCollision !== 'purple_monster'){
		Log()('monsterCollision', monsterCollision);

		if(monsterCollision === 'lava' || monsterCollision === 'poisonous_gas' || monsterCollision === 'noxious_gas'){
			Game.setMapPos(gridPos);
			this.destroy();
		}
	}

	else{
		Game.setMapPos(Game.toGridPos(this));

		this.animations.play('awake');

		Game.phaser.add.tween(this).to(moving, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, moveDelay);

		Game.setMapPos(newGridPos, 'monster');
	}
};