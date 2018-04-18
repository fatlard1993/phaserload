/* global Phaser, Game, WS, Log */

Game.entities.item = function(x, y, baseType){
	Phaser.Sprite.call(this, Game.phaser, x, y, baseType, 10);

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.item.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.item.prototype.constructor = Game.entities.item;

Game.entities.item.spriteNames = [
	'teleporter',
	'responder_teleporter',
	'responder',
	'repair_nanites',
	'timed_charge',
	'remote_charge',
	'timed_freeze_charge',
	'remote_freeze_charge',
	'explosion',
	'freeze_explosion',
	'tombstone',
	'satchel',
	'gas',
	'super_oxygen_liquid_nitrogen',
	'energy',
	'',
	'detonator',
	'detonator_3',
	'detonator_2',
	'detonator_1'
];

Game.entities.item.create = function(x, y, type){
	var baseType = type.split('_')[0];
	baseType = baseType === 'mineral' ? 'item' : baseType;

	var item = Game.items.getFirstDead();

	if(item === null){
		item = Game.items.add(new Game.entities.item(x, y, baseType));
	}
	else{
		item.reset(x, y);
		item.revive();
	}

	item.frame = baseType === 'mineral' ? Game.mineralColors.indexOf(type.replace('mineral_', '')) : Game.entities.item.spriteNames.indexOf(type);
	item.type = type;

	Game.config.map[x][y].items.sprites.push(item);
	Game.config.map[x][y].items.names.push(type);

	return item;
};

Game.entities.item.crush = function(pos){
	Game.items.forEachAlive(function(item){
		if(item.x === pos.x && item.y === pos.y){
			item.destroy();
		}
	});
};

Game.entities.item.interact = function(pos){
	var items = Game.mapPos(pos).items, count = items.length;
	var itemName, itemSprite, interactEffects;

	for(var x = 0; x < count; ++x){
		itemName = items.names[x];
		itemSprite = items.sprites[x];
		interactEffects = Game.items[itemName].interactEffects || ['collect'];

		Game.applyEffects(interactEffects, pos, itemSprite);
	}
};