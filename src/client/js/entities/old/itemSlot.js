import phaserload from '../../phaserload';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

phaserload.entities.itemSlot = function(x, y){
	Phaser.Image.call(this, phaserload.game, x, y, 'map', 'itemSlot_empty');

	this.anchor.setTo(0.5, 0.5);

	this.fixedToCamera = true;

	// this.frame = 0;
};

phaserload.entities.itemSlot.prototype = Object.create(Phaser.Image.prototype);
phaserload.entities.itemSlot.prototype.constructor = phaserload.entities.itemSlot;

phaserload.entities.itemSlot.create = function(x, y){
	var itemSlot = phaserload.foreground.add(new phaserload.entities.itemSlot(x, y));

	itemSlot.item = '';

	return itemSlot;
};

phaserload.entities.itemSlot.init = function(){
	phaserload.itemSlot1 = phaserload.entities.itemSlot.create(phaserload.config.width - 32, 32);
	phaserload.itemSlot2 = phaserload.entities.itemSlot.create(phaserload.config.width - 32, 106);
};

phaserload.entities.itemSlot.setItem = function(slotNum, item){
	var slot = 'itemSlot'+ slotNum;

	phaserload[slot].item = item;

	phaserload[slot].frameName = item === '' ? 'itemSlot_empty' : 'itemSlot_inuse';

	if(item !== ''){
		if(!phaserload[slot].itemIcon){
			phaserload[slot].itemIcon = phaserload.game.add.image(0, 0, 'map', 'item_'+ item);

			phaserload[slot].itemIcon.anchor.setTo(0.5, 0.5);

			phaserload[slot].addChild(phaserload[slot].itemIcon);
		}

		phaserload[slot].itemIcon.frameName = 'item_'+ item;
		// phaserload[slot].itemIcon.frame = phaserload.entities.item.spriteNames.indexOf(item);

		// if(item === 'detonator'){
		// 	phaserload[slot].itemIcon.animations.add('use_detonator', [phaserload[slot].itemIcon.frame + 1, phaserload[slot].itemIcon.frame + 2, phaserload[slot].itemIcon.frame + 3], 3, false);
		// }
	}
};