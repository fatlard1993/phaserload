import log from '../logger';
import phaserload from '../phaserload';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

class ItemSlotEntity extends Phaser.GameObjects.Image {
	constructor(slotNumber){
		super(phaserload.scene, phaserload.config.width - 64, 64 * slotNumber, 'map', 'itemSlot_empty');

		phaserload.groups.interfaces.add(this, true);

		this.setDepth(35);
		this.setScrollFactor(0, 0);
		this.setOrigin(0);
		this.setInteractive();
		this.on('pointerdown', this[this.itemLink ? 'use' : 'load'].bind(this));
	}

	load(){
		phaserload.player.console.draw_load_item_slot();
	}

	use(){

	}
}