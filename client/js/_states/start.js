/* global Phaser, Game, WS, Log, Cjs */

Game.states.start = function(){};

Game.states.start.prototype.create = function(){
	Log()('start');

	if(Game.initialized) return;

	Game.initialized = 1;

	Game.phaser.camera.bounds = null;

	Game.ground = Game.phaser.add.group();
	Game.lava = Game.phaser.add.group();
	Game.buildings = Game.phaser.add.group();
	Game.monsters = Game.phaser.add.group();
	Game.playersGroup = Game.phaser.add.group();
	Game.poisonous_gas = Game.phaser.add.group();
	Game.noxious_gas = Game.phaser.add.group();
	Game.minerals = Game.phaser.add.group();
	Game.items = Game.phaser.add.group();
	Game.foreground = Game.phaser.add.group();

	Game.entities.player.init();

	Game.entities.itemSlot.init();

	Game.entities.hud.init();

	Game.entities.spaceco.init();

	var playerNames = Object.keys(Game.players);

	for(var x = 0; x < playerNames.length; ++x){
		Game.players[playerNames[x]].sprite = Game.entities.player.create(Game.players[playerNames[x]]);
		if(playerNames[x] === Game.player.name) Game.player.sprite = Game.players[playerNames[x]].sprite;
	}

	Game.updateMaxHealth();
	Game.updateMaxFuel();
	Game.updateBaseMoveTime();
	Game.updateMaxHullSpace();
	Game.updateDrillSpeedMod();

	Game.drawMap(0, 0, Game.config.width, Game.config.depth);

	Game.adjustViewPosition(Game.player.sprite.x - Game.viewWidth / 2, Game.player.sprite.y - Game.viewHeight / 2, Math.ceil(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, Game.phaser.camera.x / 2, Game.phaser.camera.y / 2)));

	Game.entities.itemSlot.setItem(1, 'teleporter');

	Game.hud.open('briefing');
};