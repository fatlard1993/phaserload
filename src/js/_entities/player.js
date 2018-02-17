/* global Game, Log */

Game.entities.player = function(){};

Game.entities.player.create = function(settings){
	var playerSprite = Game.phaser.add.sprite(Game.toPx(settings.position.x), Game.toPx(1), 'drill', 15);

	playerSprite.anchor.setTo(0.5, 0.5);

	playerSprite.animations.add('normal', [0, 1, 2], 10, true);
	playerSprite.animations.add('upgrade_1', [3, 4, 5], 10, true);
	playerSprite.animations.add('upgrade_2', [6, 7, 8], 10, true);
	playerSprite.animations.add('upgrade_3', [9, 10, 11], 10, true);
	playerSprite.animations.add('teleporting', [12, 13, 14], 10, true);

	playerSprite.animations.play('normal');

	// Game.config.map[settings.position.x][1][0] = Game.mapNames.indexOf('player');

	Game.config.defaultPlayerScale = playerSprite.scale.x;

	return playerSprite;
};