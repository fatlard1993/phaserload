/* global Game, Log */

Game.entities.spaceco = function(){};

Game.entities.spaceco.create = function(settings){
	var spaceco = Game.phaser.add.sprite(Game.toPx(settings.position.x), Game.toPx(1), 'spaceco', 10);

	spaceco.frame = spaceco.damage = 0;

	spaceco.anchor.setTo(0.5, 0.65);

	spaceco.scale.setTo(0.25, 0.25);

	Game.spaceco.resourceBay = {};

	return spaceco;
};