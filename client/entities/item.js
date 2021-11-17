import phaserload from '../phaserload';

import Phaser from 'phaser';

export default class ItemEntity extends Phaser.GameObjects.Image {
	constructor(x, y, type) {
		super(phaserload.scene, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', type);

		phaserload.scene.add.existing(this);

		var baseType = type.split('_')[0];
		if (baseType !== 'mineral') baseType = 'item';

		// var item = phaserload.items.getFirstDead();

		// if(item === null){
		// 	item = phaserload.items.add(new phaserload.entities.item(x, y, type));
		// }
		// else{
		// 	item.reset(phaserload.toPxPos(x), phaserload.toPxPos(y));
		// 	item.revive();
		// }

		this.frameName = type;

		// item.frame = baseType === 'mineral' ? phaserload.options.mineralColors.indexOf(type.replace('mineral_', '')) : phaserload.entities.item.spriteNames.indexOf(type);
		this.type = type;
	}

	interact() {
		//todo make this only interact with this individual item and make a parent function that handles looping through the whole space
		var items = phaserload.mapPos(this.x, this.y).items,
			count = items.names.length;
		var itemName, itemSprite, interactEffects;

		for (var x = 0; x < count; ++x) {
			itemName = items.names[x];
			itemSprite = items.sprites[x];
			interactEffects = phaserload.config.items[itemName] && phaserload.config.items[itemName].interactEffects ? phaserload.config.items[itemName].interactEffects : ['collect'];

			phaserload.applyEffects(interactEffects, { x: this.x, y: this.y }, { name: itemName, sprite: itemSprite });
		}
	}
}

// phaserload.entities.item.spriteNames = [
// 	'teleporter',
// 	'responder_teleporter',
// 	'responder',
// 	'repair_nanites',
// 	'timed_charge',
// 	'remote_charge',
// 	'timed_freeze_charge',
// 	'remote_freeze_charge',
// 	'explosion',
// 	'freeze_explosion',
// 	'tombstone',
// 	'satchel',
// 	'gas',
// 	'super_oxygen_liquid_nitrogen',
// 	'energy',
// 	'',
// 	'detonator',
// 	'detonator_3',
// 	'detonator_2',
// 	'detonator_1'
// ];

// phaserload.entities.item.interact = function(pos){
// 	var items = phaserload.mapPos(pos).items, count = items.names.length;
// 	var itemName, itemSprite, interactEffects;

// 	for(var x = 0; x < count; ++x){
// 		itemName = items.names[x];
// 		itemSprite = items.sprites[x];
// 		interactEffects = phaserload.config.items[itemName] && phaserload.config.items[itemName].interactEffects ? phaserload.config.items[itemName].interactEffects : ['collect'];

// 		phaserload.applyEffects(interactEffects, pos, { name: itemName, sprite: itemSprite });
// 	}
// };
