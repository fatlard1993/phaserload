/* global Game, Log, Phaser */

Game.entities.itemSlot = function(x, y){
	Phaser.Image.call(this, Game.phaser, x, y, 'map', 'itemSlot_empty');

	this.anchor.setTo(0.5, 0.5);

	this.fixedToCamera = true;

	// this.frame = 0;
};

Game.entities.itemSlot.prototype = Object.create(Phaser.Image.prototype);
Game.entities.itemSlot.prototype.constructor = Game.entities.itemSlot;

Game.entities.itemSlot.create = function(x, y){
	var itemSlot = Game.foreground.add(new Game.entities.itemSlot(x, y));

	itemSlot.item = '';

	return itemSlot;
};

Game.entities.itemSlot.init = function(){
	Game.itemSlot1 = Game.entities.itemSlot.create(Game.viewWidth - 32, 32);
	Game.itemSlot2 = Game.entities.itemSlot.create(Game.viewWidth - 32, 106);
};

Game.entities.itemSlot.setItem = function(slotNum, item){
	Log()(slotNum, item);

	var slot = 'itemSlot'+ slotNum;

	Game[slot].item = item;

	Game[slot].frameName = item === '' ? 'itemSlot_empty' : 'itemSlot_inuse';

	if(item !== ''){
		if(!Game[slot].itemIcon){
			Game[slot].itemIcon = Game.phaser.add.image(0, 0, 'map', 'item_'+ item);

			Game[slot].itemIcon.anchor.setTo(0.5, 0.5);

			Game[slot].addChild(Game[slot].itemIcon);
		}

		Game[slot].itemIcon.frameName = 'item_'+ item;
		// Game[slot].itemIcon.frame = Game.entities.item.spriteNames.indexOf(item);

		// if(item === 'detonator'){
		// 	Game[slot].itemIcon.animations.add('use_detonator', [Game[slot].itemIcon.frame + 1, Game[slot].itemIcon.frame + 2, Game[slot].itemIcon.frame + 3], 3, false);
		// }
	}
};