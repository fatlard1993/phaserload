import phaserload from '../phaserload';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

class GroundEntity extends Phaser.GameObjects.Sprite {
	constructor(x, y, type){
		super(phaserload.scene, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', `ground_${type}`);

		phaserload.groups.ground.add(this, true);

		this.setDepth(phaserload.layers.ground);

		this.type = type;
	}

	dig(speed = phaserload.state.world.gravity){
		speed -= 50;

		this.anims.create({
			key: 'dig',
			frames: this.anims.generateFrameNames('map', {
				prefix: `ground_${this.type}_dig`,
				start: 1,
				end: 3
			}),
			duration: speed,//todo account for mineral density and player drill parts
			repeat: 0
		});

		this.anims.play('dig', false);

		setTimeout(() => { this.destroy(); }, speed);
	}
}