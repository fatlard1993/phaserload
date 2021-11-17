import phaserload from '../../phaserload';

import { jsUtil } from 'js-util';
import Phaser from 'phaser';

export default class Entity extends Phaser.GameObjects.Sprite {
	constructor(x, y, type) {
		super(phaserload.scene, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', type);

		phaserload.scene.add.existing(this);
	}
}

phaserload.entities.poisonous_gas = function (x, y) {
	Phaser.Sprite.call(this, phaserload.game, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', 'poisonous_gas_fill1');

	this.anchor.setTo(0.5, 0.5);

	var fillAnim = this.animations.add('fill', Phaser.Animation.generateFrameNames('poisonous_gas_fill', 1, 3), 3, false);
	fillAnim.onComplete.add(function () {
		this.animations.play('full');
	}, this);

	var dissipateAnim = this.animations.add('dissipate', Phaser.Animation.generateFrameNames('poisonous_gas_fill', 3, 1), 3, false);
	dissipateAnim.onComplete.add(function () {
		phaserload.setMapPos(phaserload.toGridPos(this));
	}, this);
};

phaserload.entities.poisonous_gas.prototype = Object.create(Phaser.Sprite.prototype);
phaserload.entities.poisonous_gas.prototype.constructor = phaserload.entities.poisonous_gas;

phaserload.entities.poisonous_gas.create = function (x, y, spreadChance) {
	var poisonous_gas = phaserload.poisonous_gas.getFirstDead();

	if (!poisonous_gas) {
		poisonous_gas = phaserload.poisonous_gas.add(new phaserload.entities.poisonous_gas(x, y));
	} else {
		poisonous_gas.reset(phaserload.toPxPos(x), phaserload.toPxPos(y));
		poisonous_gas.revive();
		poisonous_gas.animations.stop();
		poisonous_gas.animations.getAnimation('full').destroy();
	}

	var fullAnim = poisonous_gas.animations.add('full', Phaser.Animation.generateFrameNames('poisonous_gas_full', 1, 3), 5, spreadChance === undefined);

	if (spreadChance !== undefined) {
		poisonous_gas.spreadChance = spreadChance - jsUtil.randInt(5, 20);

		fullAnim.onComplete.add(function () {
			phaserload.entities.poisonous_gas.spread(poisonous_gas);
		}, poisonous_gas);
	} else {
		poisonous_gas.spreadChance = 100;

		poisonous_gas.animations.play('full');
	}

	phaserload.state.world.map[x][y].ground.name = 'poisonous_gas';
	phaserload.state.world.map[x][y].ground.base = 'gas';
	phaserload.state.world.map[x][y].ground.variant = 'poisonous';
	phaserload.state.world.map[x][y].ground.sprite = poisonous_gas;

	return poisonous_gas;
};

phaserload.entities.poisonous_gas.spread = function (poisonous_gas) {
	var pos = phaserload.toGridPos(poisonous_gas);
	var spreadChance = poisonous_gas.spreadChance;

	var surrounds = phaserload.getSurrounds(pos, { left: 1, top: 1, right: 1 }, 'ground');

	if (pos.x - 1 > 0 && !surrounds.left && jsUtil.chance(spreadChance)) {
		phaserload.setMapPos({ x: pos.x - 1, y: pos.y }, 'poisonous_gas', 'fill', null, spreadChance);
	}

	if (pos.x + 1 < phaserload.state.world.width && !surrounds.right && jsUtil.chance(spreadChance)) {
		phaserload.setMapPos({ x: pos.x + 1, y: pos.y }, 'poisonous_gas', 'fill', null, spreadChance);
	}

	if (pos.y - 1 > 0 && !surrounds.top && jsUtil.chance(spreadChance)) {
		phaserload.setMapPos({ x: pos.x, y: pos.y - 1 }, 'poisonous_gas', 'fill', null, spreadChance);
	}

	poisonous_gas.animations.play('dissipate');
};
