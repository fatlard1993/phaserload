import phaserload from '../phaserload';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

class MineralEntity extends Phaser.GameObjects.Image {
	constructor(x, y, type){
		super(phaserload.scene, phaserload.toPx(x), phaserload.toPx(y), 'map', `mineral_${type}`);

		phaserload.scene.add.existing(this);

		this.type = type;

		this.setDepth(2);
	}

	collect(){
		phaserload.scene.tweens.add({
			targets: this,
			x: phaserload.scene.cameras.main.scrollX,
			y: phaserload.scene.cameras.main.scrollY,
			alpha: 0,
			duration: 800,
			ease: 'Linear',
			onComplete: () => { this.destroy(); },
			onCompleteScope: this
		});
	}
}