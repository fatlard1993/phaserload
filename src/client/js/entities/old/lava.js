import phaserload from '../../phaserload';

import util from 'js-util';
import Phaser from './node_modules/phaser/dist/phaser.min.js';

class Entity extends Phaser.GameObjects.Sprite {
	constructor(x, y, type){
		super(phaserload.scene, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', type);

		phaserload.scene.add.existing(this);
	}
}



phaserload.entities.lava = function(x, y){
	Phaser.Sprite.call(this, phaserload.game, phaserload.toPxPos(x), phaserload.toPxPos(y), 'lava');

	this.anchor.setTo(0.5, 0.5);

	var fillAnim = this.animations.add('fill', [0, 1, 2], 3, false);
	fillAnim.onComplete.add(function(){
		this.play('full');
	}, this);

	return this;
};

phaserload.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
phaserload.entities.lava.prototype.constructor = phaserload.entities.lava;

phaserload.entities.lava.create = function(x, y, spread){
	var lava = phaserload.lava.getFirstDead();

	if(!lava){
		lava = phaserload.lava.add(new phaserload.entities.lava(x, y));
	}

	else{
		lava.reset(phaserload.toPxPos(x), phaserload.toPxPos(y));
		lava.revive();
		lava.animations.stop();
		lava.animations.getAnimation('full').destroy();
	}

	var fullAnim = lava.animations.add('full', [3, 4, 5], 5, !spread);

	if(spread){
		fullAnim.onComplete.add(function(){
			phaserload.entities.lava.spread(lava);

			lava.animations.getAnimation('full').destroy();
			lava.animations.add('full', [3, 4, 5], 5, true);
			lava.animations.play('full');
		}, lava);
	}

	else{
		lava.animations.play('full');
	}

	phaserload.state.world.map[x][y].ground.name = 'lava';
	phaserload.state.world.map[x][y].ground.base = 'lava';
	phaserload.state.world.map[x][y].ground.variant = 'lava';
	phaserload.state.world.map[x][y].ground.sprite = lava;

	return lava;
};

phaserload.entities.lava.spread = function(lava){
	var pos = phaserload.toGridPos(lava);

	var surrounds = phaserload.getSurrounds(pos, { left: 1, right: 1, bottom: 1 });

	if(pos.x - 1 >= 0 && (!surrounds.left || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.left])){
		if(surrounds.left === 'ground_red' && util.chance(80)) return;

		phaserload.setMapPos({ x: pos.x - 1, y: pos.y }, 'lava', 'fill');
	}

	if(pos.x + 1 < phaserload.state.world.width && (!surrounds.right || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.right])){
		if(surrounds.right === 'ground_red' && util.chance(80)) return;

		phaserload.setMapPos({ x: pos.x + 1, y: pos.y }, 'lava', 'fill');
	}

	if(pos.y + 1 < phaserload.state.world.depth - 2 && (!surrounds.bottom || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.bottom])){
		if(surrounds.bottom === 'ground_red' && util.chance(40)) return;

		phaserload.setMapPos({ x: pos.x, y: pos.y + 1 }, 'lava', 'fill');
	}
};