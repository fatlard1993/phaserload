/* global Phaser, Game, Log */

Game.entities.hud = function(){};

Game.entities.hud.create = function(x, y){
	var hud = Game.phaser.add.sprite(x, y, 'hud');

	hud.scale.setTo(0.4, 0.4);
	hud.fixedToCamera = true;

	hud.isOpen = false;

	hud.statusText = Game.phaser.add.text(20, 15, '', { font: '26px '+ Game.config.font, fill: Game.config.hudTextColor });
	hud.statusText.lineSpacing = -8;
	hud.addChild(hud.statusText);

	hud.interfaceText = Game.phaser.add.text(20, 20, '', { font: '13px '+ Game.config.font, fill: '#fff', fontWeight: 'bold' });
	hud.addChild(hud.interfaceText);

	hud.bottomLine = Game.phaser.add.text(20, 211, '', { font: '11px '+ Game.config.font, fill: Game.config.hudTextColor });
	hud.addChild(hud.bottomLine);

	return hud;
};