/* global Phaser, Game, WS, Log */

Game.entities.item = function(x, y, type){
	Phaser.Image.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'map', type);

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.item.prototype = Object.create(Phaser.Image.prototype);
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
	if(baseType !== 'mineral') baseType = 'item';

	Log()(type);

	var item = Game.items.getFirstDead();

	if(item === null){
		item = Game.items.add(new Game.entities.item(x, y, type));
	}
	else{
		item.reset(Game.toPx(x), Game.toPx(y));
		item.revive();
	}

	item.frameName = type;

	// item.frame = baseType === 'mineral' ? Game.mineralColors.indexOf(type.replace('mineral_', '')) : Game.entities.item.spriteNames.indexOf(type);
	item.type = type;

	Game.config.map[x][y].items.sprites.push(item);
	Game.config.map[x][y].items.names.push(type);

	return item;
};

Game.entities.item.interact = function(pos){
	var items = Game.mapPos(pos).items, count = items.names.length;
	var itemName, itemSprite, interactEffects;

	for(var x = 0; x < count; ++x){
		itemName = items.names[x];
		itemSprite = items.sprites[x];
		interactEffects = Game.config.items[itemName] && Game.config.items[itemName].interactEffects ? Game.config.items[itemName].interactEffects : ['collect'];

		Game.applyEffects(interactEffects, pos, { name: itemName, sprite: itemSprite });
	}
};