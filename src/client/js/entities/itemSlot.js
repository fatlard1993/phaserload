import log from '../logger';
import phaserload from '../phaserload';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

class ItemSlotEntity extends Phaser.GameObjects.Image {
	constructor(slotNumber){
		super(phaserload.scene, phaserload.config.width - 64, 64 * slotNumber, 'map', 'itemSlot_empty');

		phaserload.groups.interfaces.add(this, true);

		this.setDepth(phaserload.layers.interfaces);
		this.setScrollFactor(0, 0);
		this.setOrigin(0);
		this.setInteractive();
		this.on('pointerdown', this[this.itemLink ? 'use' : 'load'].bind(this));

		this.itemIcon = new Phaser.GameObjects.Image(phaserload.scene, this.x, this.y, 'map', null);
		this.itemIcon.setDepth(phaserload.layers.interfaces + 1);
		this.itemIcon.setScrollFactor(0, 0);
		this.itemIcon.setOrigin(0);
	}

	load(){
		phaserload.player.console.draw_load_item_slot();
	}

	set(item){
		this.item = item;

		this.setFrame(item === '' ? 'itemSlot_empty' : 'itemSlot_inuse');

		if(item !== '') this.itemIcon.setFrame(`item_${item}`);
	}

	use(){

	}
}