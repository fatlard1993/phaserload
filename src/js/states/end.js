/* global Phaser, Game */

Game.states.end = function(game){};

Game.states.end.prototype.create = function(){
  Game.setupStage();

  var tweenTime = 500;
  var delay = 0;
  var delayIncrement = 100;
  var text;

  text = this.game.add.text(0, -100, 'Game over!', { font: '60px ' + Game.config.font, fill: Game.config.textColor, stroke: Game.config.backgroundColor, strokeThickness: 10 });
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 80 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement;

  text = this.game.add.text(0, -100, 'You died at depth: '+ Game.depth, { font: '40px ' + Game.config.font, fill: Game.config.textColor, stroke: Game.config.backgroundColor, strokeThickness: 10 });
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 170 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement;

  text = this.game.add.text(0, -100, Game.loseReason === 'fuel' ? 'Ran out of fuel' : 'Killed by: '+ Game.loseReason, { font: '40px ' + Game.config.font, fill: Game.config.textColor, stroke: Game.config.backgroundColor, strokeThickness: 10 });
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 220 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement;

  text = this.game.add.text(0, this.game.height, 'Click or press [enter]', { font: '40px ' + Game.config.font, fill: Game.config.textColor });
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 300 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement;

  this.game.input.onDown.add(function(){ this.game.state.start('game'); }, this);
  this.game.input.keyboard.onDownCallback = function(evt){
    if(this.game.input.keyboard.event.keyCode === Phaser.Keyboard.ENTER){
      this.game.state.start('game');
    }
  };
};

Game.states.end.prototype.update = function(){};