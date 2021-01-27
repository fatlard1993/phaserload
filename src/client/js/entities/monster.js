import phaserload from '../phaserload';

import util from 'js-util';
import Phaser from './node_modules/phaser/dist/phaser.min.js';

class Entity extends Phaser.GameObjects.Sprite {
	constructor(x, y, type){
		super(phaserload.scene, phaserload.toPx(x), phaserload.toPx(y), 'map', type);

		phaserload.scene.add.existing(this);
	}
}


phaserload.entities.monster = function(x, y, type){
	Phaser.Sprite.call(this, phaserload.game, phaserload.toPx(x), phaserload.toPx(y), 'map', type +'_monster_sleep1');

	this.anchor.setTo(0.5, 0.5);

	this.animations.add('sleep', Phaser.Animation.generateFrameNames(type +'_monster_sleep', 1, 3), util.randInt(2, 6), true);
	this.animations.add('awake', Phaser.Animation.generateFrameNames(type +'_monster_awake', 1, 3), util.randInt(6, 12), true);
};

phaserload.entities.monster.prototype = Object.create(Phaser.Sprite.prototype);
phaserload.entities.monster.prototype.constructor = phaserload.entities.monster;

phaserload.entities.monster.create = function(x, y, type){
	var monster = phaserload.monsters.getFirstDead();

	if(monster === null){
		monster = phaserload.monsters.add(new phaserload.entities.monster(x, y, type));
	}
	else{
		monster.reset(phaserload.toPx(x), phaserload.toPx(y));
		monster.revive();
	}

	monster.type = type;

	monster.animations.play('sleep');

	phaserload.state.world.map[x][y].ground.name = type +'_monster';
	phaserload.state.world.map[x][y].ground.base = 'monster';
	phaserload.state.world.map[x][y].ground.variant = type;
	phaserload.state.world.map[x][y].ground.sprite = monster;

	return monster;
};

phaserload.entities.monster.prototype.update = function(){
	if(!this.alive || phaserload.game.tweens.isTweening(this)) return;

	var gridPos = phaserload.toGridPos(this);

	var aggroDistance = phaserload.toPx(this.type === 'red' ? 8 : 4);

	if(phaserload.game.math.distance(phaserload.player.sprite.x, phaserload.player.sprite.y, this.x, this.y) > aggroDistance) return;

	var moving;

	var xDiff = this.x - phaserload.player.sprite.x;
	var yDiff = this.y - phaserload.player.sprite.y;

	var xDirection = xDiff > 0 ? 'left' : 'right';
	var yDirection = yDiff > 0 ? 'up' : 'down';

	// var wantToMove = Math.abs(xDiff) > Math.abs(yDiff) ? xDirection : yDirection;

	var surrounds = phaserload.getSurrounds(gridPos, { left: 1, top: 1, right: 1, bottom: 1 });

	var canMove = {};

	if(gridPos.x - 1 > 0 && (surrounds.left === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.left])){
		canMove.left = 1;
	}

	if(gridPos.x + 1 < phaserload.state.world.width && (surrounds.right === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.right])){
		canMove.right = 1;
	}

	if(gridPos.y - 1 > 0 && (surrounds.top === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.top])){
		canMove.up = 1;
	}

	if(gridPos.y + 1 > 0 && (surrounds.bottom === undefined || { poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.bottom])){
		canMove.down = 1;
	}

	if(yDiff !== 0 && yDirection === 'up' && canMove.up){
		moving = { x: this.x, y: this.y - phaserload.blockPx };
	}

	else if(yDiff !== 0 && yDirection === 'down' && canMove.down){
		moving = { x: this.x, y: this.y + phaserload.blockPx };
	}

	else if(xDirection === 'left' && canMove.left){
		moving = { x: this.x - phaserload.blockPx, y: this.y };
	}

	else if(xDirection === 'right' && canMove.right){
		moving = { x: this.x + phaserload.blockPx, y: this.y };
	}

	if(!moving) return this.animations.play('sleep');

	this.justMoved = this.x !== moving.x ? (this.x - moving.x > 0 ? 'left' : 'right') : this.y !== moving.y > 0 ? 'up' : 'down';

	var moveDelay = 300;
	var moveSpeed = this.type === 'red' ? 400 : 200;

	if(!this.hadFirstMove){
		this.hadFirstMove = 1;
		moveDelay += 1000;
	}

	var newGridPos = phaserload.toGridPos(moving);

	var monsterCollision = phaserload.mapPos(newGridPos).ground.name;

	if(monsterCollision && monsterCollision !== 'red_monster' && monsterCollision !== 'purple_monster'){
		if(monsterCollision === 'lava' || monsterCollision === 'poisonous_gas' || monsterCollision === 'noxious_gas'){
			phaserload.setMapPos(gridPos);
			this.destroy();
		}
	}

	else{
		phaserload.setMapPos(phaserload.toGridPos(this));

		this.animations.play('awake');

		phaserload.game.add.tween(this).to(moving, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, moveDelay);

		phaserload.setMapPos(newGridPos, 'monster');
	}
};