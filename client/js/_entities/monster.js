/* global Phaser, Game, Log */

Game.entities.monster = function(x, y, type){
	Phaser.Sprite.call(this, Game.phaser, x, y, type +'_monster');

	this.anchor.setTo(0.5, 0.5);

	this.animations.add('sleeping', [0, 1, 2], Game.rand(2, 6), true);
	this.animations.add('moving', [3, 4, 5], Game.rand(6, 12), true);
};

Game.entities.monster.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.monster.prototype.constructor = Game.entities.monster;

Game.entities.monster.create = function(x, y, type){
	var monster = Game.monsters.getFirstDead();

	if(monster === null){
		monster = Game.monsters.add(new Game.entities.monster(x, y, type));
	}
	else{
		monster.reset(x, y);
		monster.revive();
	}

	monster.type = type;

	monster.animations.play('sleeping');

	return monster;
};

Game.entities.monster.prototype.update = function(){
	if(!this.alive || Game.phaser.tweens.isTweening(this)) return;

	var gridPos = {
		x: Game.toGridPos(this.x),
		y: Game.toGridPos(this.y)
	};

	var aggroDistance = Game.toPx(this.type === 'red' ? 8 : 4);

	if(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, this.x, this.y) > aggroDistance) return;

	var moving;

	var xDiff = this.x - Game.player.sprite.x;
	var yDiff = this.y - Game.player.sprite.y;

	var xDirection = xDiff > 0 ? 'left' : 'right';
	var yDirection = yDiff > 0 ? 'up' : 'down';

	// var wantToMove = Math.abs(xDiff) > Math.abs(yDiff) ? xDirection : yDirection;

	var canMove = {};

	if(gridPos.x - 1 > 0 && (!Game.mapPosName(gridPos.x - 1, gridPos.y) || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[Game.mapPosName(gridPos.x - 1, gridPos.y)])){
		canMove.left = 1;
	}

	if(gridPos.x + 1 < Game.config.width && (!Game.mapPosName(gridPos.x + 1, gridPos.y) || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[Game.mapPosName(gridPos.x + 1, gridPos.y)])){
		canMove.right = 1;
	}

	if(gridPos.y - 1 > 0 && (!Game.mapPosName(gridPos.x, gridPos.y - 1) || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[Game.mapPosName(gridPos.x, gridPos.y - 1)])){
		canMove.up = 1;
	}

	if(gridPos.y + 1 > 0 && (!Game.mapPosName(gridPos.x, gridPos.y + 1) || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[Game.mapPosName(gridPos.x, gridPos.y + 1)])){
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

	if(!moving) return this.animations.play('sleeping');

	this.justMoved = this.x !== moving.x ? (this.x - moving.x > 0 ? 'left' : 'right') : this.y !== moving.y > 0 ? 'up' : 'down';

	var moveDelay = 300;
	var moveSpeed = this.type === 'red' ? 400 : 200;

	if(!this.hadFirstMove){
		this.hadFirstMove = 1;
		moveDelay += 1000;
	}

	var newGridPos = {
		x: Game.toGridPos(moving.x),
		y: Game.toGridPos(moving.y)
	};

	var monsterCollision = Game.mapPosName(newGridPos.x, newGridPos.y);

	if(monsterCollision && monsterCollision !== 'red_monster' && monsterCollision !== 'purple_monster'){
		Log()('monsterCollision', monsterCollision);

		if(monsterCollision === 'lava'){
			Game.setMapPos({ x: this.x, y: this.y }, -1);
			this.kill();
		}

		else if(monsterCollision === 'poisonous_gas'){
			Game.setMapPos({ x: this.x, y: this.y }, -1);
			this.kill();
		}

		else if(monsterCollision === 'noxious_gas'){
			Game.setMapPos({ x: this.x, y: this.y }, -1);
			this.kill();
		}
	}

	else{
		Game.setMapPos({ x: this.x, y: this.y }, -1);

		this.animations.play('moving');

		Game.phaser.add.tween(this).to(moving, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, moveDelay);

		Game.setMapPos(moving, Game.mapNames.indexOf('monster'));
	}
};