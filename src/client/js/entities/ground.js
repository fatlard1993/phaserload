import phaserload from '../phaserload';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

class GroundEntity extends Phaser.GameObjects.Sprite {
	constructor(x, y, type){
		super(phaserload.scene, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', `ground_${type}`);

		phaserload.groups.ground.add(this, true);

		this.setDepth(phaserload.layers.ground);

		this.type = type;

		this.anims.create({
			key: 'dig',
			frames: this.anims.generateFrameNames('map', {
				prefix: `ground_${type}_dig`,
				start: 1,
				end: 3
			}),
			duration: phaserload.state.world.gravity,//todo account for mineral density and player drill parts
			repeat: 0
		});
	}

	dig(){
		this.anims.play('dig', false);

		setTimeout(() => { this.destroy(); }, phaserload.state.world.gravity);
	}
}