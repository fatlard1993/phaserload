import phaserload from '../../phaserload';

import util from 'js-util';
import Phaser from './node_modules/phaser/dist/phaser.min.js';


class Entity extends Phaser.GameObjects.Sprite {
	constructor(x, y, type){
		super(phaserload.scene, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', type);

		phaserload.scene.add.existing(this);
	}
}


phaserload.entities.noxious_gas = function(x, y){
	Phaser.Sprite.call(this, phaserload.game, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', 'noxious_gas_fill1');

	this.anchor.setTo(0.5, 0.5);
};

phaserload.entities.noxious_gas.prototype = Object.create(Phaser.Sprite.prototype);
phaserload.entities.noxious_gas.prototype.constructor = phaserload.entities.noxious_gas;

phaserload.entities.noxious_gas.create = function(x, y, isNew, spawnChance, spreadChance){
	if(isNew && spawnChance !== undefined && !util.chance(spawnChance)) return;

	var noxious_gas = phaserload.noxious_gas.getFirstDead();

	var fillAnim, dissipateAnim, fullAnim;

	if(!noxious_gas){
		noxious_gas = phaserload.noxious_gas.add(new phaserload.entities.noxious_gas(x, y));
	}
	else{
		noxious_gas.reset(phaserload.toPxPos(x), phaserload.toPxPos(y));
		noxious_gas.revive();
		noxious_gas.animations.stop();
	}

	fillAnim = noxious_gas.animations.add('fill', Phaser.Animation.generateFrameNames('noxious_gas_fill', 1, 3), 3, false);
	fillAnim.onComplete.add(function(){
		noxious_gas.animations.play('full');
	}, noxious_gas);

	fullAnim = noxious_gas.animations.add('full', Phaser.Animation.generateFrameNames('noxious_gas_full', 1, 3), 6, false);

	dissipateAnim = noxious_gas.animations.add('dissipate', Phaser.Animation.generateFrameNames('noxious_gas_fill', 3, 1), 3, false);
	dissipateAnim.killOnComplete = true;

	if(isNew){
		noxious_gas.spreadChance = spreadChance !== undefined ? spreadChance : spawnChance !== undefined ? spawnChance - util.randInt(5, 17) : 100;

		fullAnim.onComplete.add(function(){
			phaserload.entities.noxious_gas.spread(noxious_gas);
		}, noxious_gas);

		dissipateAnim.onComplete.add(function(){
			phaserload.setMapPos({ x: noxious_gas.x, y: noxious_gas.y });
		}, noxious_gas);

		phaserload.setMapPos({ x: x, y: y }, 'noxious_gas', 'fill');

		noxious_gas.animations.play('fill');
	}

	else{
		fullAnim.onComplete.add(function(){
			noxious_gas.animations.play('dissipate');
		}, noxious_gas);

		noxious_gas.animations.play('full');
	}

	phaserload.state.world.map[x][y].ground.name = 'noxious_gas';
	phaserload.state.world.map[x][y].ground.base = 'gas';
	phaserload.state.world.map[x][y].ground.variant = 'noxious';
	phaserload.state.world.map[x][y].ground.sprite = noxious_gas;

	return noxious_gas;
};

phaserload.entities.noxious_gas.spread = function(noxious_gas){
	var gridPos = phaserload.toGridPos(noxious_gas);

	var surrounds = phaserload.getSurrounds(gridPos, { left: 1, top: 1, right: 1, bottom: 1 });

	if(gridPos.x - 1 > 0 && (surrounds.left === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.left])){
		phaserload.entities.noxious_gas.create(gridPos.x - 1, gridPos.y, 1, noxious_gas.spreadChance);
	}

	if(gridPos.x + 1 < phaserload.state.world.width && (surrounds.right === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.right])){
		phaserload.entities.noxious_gas.create(gridPos.x + 1, gridPos.y, 1, noxious_gas.spreadChance);
	}

	if(gridPos.y - 1 > 0 && (surrounds.top === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.top])){
		if(util.chance(30)) phaserload.entities.noxious_gas.create(gridPos.x, gridPos.y - 1, 1, noxious_gas.spreadChance);
	}

	if(gridPos.y + 1 > 0 && (surrounds.bottom === undefined || { purple_monster: 1, red_monster: 1 }[surrounds.bottom])){
		phaserload.entities.noxious_gas.create(gridPos.x, gridPos.y + 1, 1, noxious_gas.spreadChance);
	}

	noxious_gas.animations.play('dissipate');
};