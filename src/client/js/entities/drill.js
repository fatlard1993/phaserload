import phaserload from '../phaserload';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

class DrillEntity extends Phaser.GameObjects.Sprite {
	constructor(x, y, playerName){
		super(phaserload.scene, phaserload.toPx(x), phaserload.toPx(y), 'map', 'drill_move1');

		this.playerName = playerName;

		phaserload.groups.mobs.add(this, true);

		this.setDepth(3);

		this.anims.create({
			key: 'move',
			frames: this.anims.generateFrameNames('map', {
				prefix: 'drill_move',
				start: 1,
				end: 3
			}),
			frameRate: 10,
			repeat: -1
		});

		this.anims.create({
			key: 'teleport',
			frames: this.anims.generateFrameNames('map', {
				prefix: 'drill_teleport',
				start: 1,
				end: 3
			}),
			frameRate: 10,
			repeat: -1
		});

		this.anims.play('move');
	}
}