/* global Phaser, Game */

Game.states.lobby = function(game){};

Game.states.lobby.prototype.create = function(){
  Game.setupStage();

  this.addTitles();

  console.log('lobby');

  this.game.input.onDown.add(function(){ this.game.state.start('game'); }, this);
  this.game.input.keyboard.onDownCallback = function(evt){
    if(this.game.input.keyboard.event.keyCode === Phaser.Keyboard.ENTER){
      this.game.state.start('game');
    }
  };
};

Game.states.lobby.prototype.addTitles = function(){
  var text;

  var delay = 500;
  var tweenTime = 750;
  var delayIncrement = 100;

  text = this.game.add.text(0, -100, 'Phaserload', { font: '48px ' + Game.config.font, fill: Game.config.textColor });
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 100 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement;

  text = this.game.add.text(0, this.game.height, 'Click or press [enter]', { font: '40px ' + Game.config.font, fill: Game.config.textColor });
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 300 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement;
};

Game.states.lobby.prototype.update = function(){};