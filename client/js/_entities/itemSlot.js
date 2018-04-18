/* global Game, Log, Phaser */

Game.entities.itemSlot = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'itemSlot');

	this.anchor.setTo(0.5, 0.5);

	this.fixedToCamera = true;

	this.frame = 0;
};

Game.entities.itemSlot.prototype = Object.create(Phaser.Sprite.prototype);
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

	Game[slot].frame = item === '' ? 0 : 1;

	if(item !== ''){
		if(!Game[slot].itemSprite){
			Game[slot].itemSprite = Game.phaser.add.sprite(0, 0, 'item');

			Game[slot].itemSprite.anchor.setTo(0.5, 0.5);

			Game[slot].addChild(Game[slot].itemSprite);
		}

		Game[slot].itemSprite.frame = Game.entities.item.spriteNames.indexOf(item);

		if(item === 'detonator'){
			Game[slot].itemSprite.animations.add('use_detonator', [Game[slot].itemSprite.frame + 1, Game[slot].itemSprite.frame + 2, Game[slot].itemSprite.frame + 3], 3, false);
		}
	}
};