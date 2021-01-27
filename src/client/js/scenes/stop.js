import phaserload from '../phaserload';

phaserload.config.scene.stop = function(){
	var tweenTime = 500;
	var delay = 0;
	var delayIncrement = 100;
	var text;

	// text = phaserload.game.add.text(0, -100, 'Game over!', { font: '60px ' + phaserload.config.font, fill: phaserload.config.textColor });
	// text.updateTransform();
	// text.x = phaserload.game.width / 2 - text.getBounds().width / 2;
	// text.alpha = 0;
	// phaserload.game.add.tween(text).to({ y: 80 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
	// phaserload.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
	// delay += delayIncrement;

	// text = phaserload.game.add.text(0, -100, (phaserload.loseReason === 'fuel' ? 'Ran out of fuel' : 'Killed by '+ util.capitalize(phaserload.loseReason, 1, '_')) + ' At depth: '+ phaserload.loseDepth, { font: '40px ' + phaserload.config.font, fill: phaserload.config.textColor });
	// text.updateTransform();
	// text.x = phaserload.game.width / 2 - text.getBounds().width / 2;
	// text.alpha = 0;
	// phaserload.game.add.tween(text).to({ y: 220 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
	// phaserload.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
	// delay += delayIncrement;

	// text = phaserload.game.add.text(0, phaserload.game.height, 'Tap to restart', { font: '40px ' + phaserload.config.font, fill: phaserload.config.textColor });
	// text.updateTransform();
	// text.x = phaserload.game.width / 2 - text.getBounds().width / 2;
	// text.alpha = 0;
	// phaserload.game.add.tween(text).to({ y: 300 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
	// phaserload.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
	// delay += delayIncrement;

	// phaserload.game.input.onDown.add(function(){
	// 	window.location.reload();
	// 	// phaserload.game.state.start('play');
	// }, this);
};