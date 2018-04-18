/* global Phaser, Game, Log, Cjs */

Game.states.end = function(){};

Game.states.end.prototype.create = function(){
	Log()('end');

	var tweenTime = 500;
	var delay = 0;
	var delayIncrement = 100;
	var text;

	text = Game.phaser.add.text(0, -100, 'Game over!', { font: '60px ' + Game.config.font, fill: Game.config.textColor, stroke: Game.config.backgroundColor, strokeThickness: 10 });
	text.updateTransform();
	text.x = Game.phaser.width/2 - text.getBounds().width/2;
	text.alpha = 0;
	Game.phaser.add.tween(text).to({ y: 80 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
	Game.phaser.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
	delay += delayIncrement;

	text = Game.phaser.add.text(0, -100, (Game.loseReason === 'fuel' ? 'Ran out of fuel' : 'Killed by '+ Cjs.capitalize(Game.loseReason, 1, '_')) + ' At depth: '+ Game.loseDepth, { font: '40px ' + Game.config.font, fill: Game.config.textColor, stroke: Game.config.backgroundColor, strokeThickness: 10 });
	text.updateTransform();
	text.x = Game.phaser.width/2 - text.getBounds().width/2;
	text.alpha = 0;
	Game.phaser.add.tween(text).to({ y: 220 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
	Game.phaser.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
	delay += delayIncrement;

	text = Game.phaser.add.text(0, Game.phaser.height, 'Tap to restart', { font: '40px ' + Game.config.font, fill: Game.config.textColor });
	text.updateTransform();
	text.x = Game.phaser.width/2 - text.getBounds().width/2;
	text.alpha = 0;
	Game.phaser.add.tween(text).to({ y: 300 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
	Game.phaser.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
	delay += delayIncrement;

	Game.phaser.input.onDown.add(function(){
		window.location.reload();
		// Game.phaser.state.start('play');
	}, this);
};