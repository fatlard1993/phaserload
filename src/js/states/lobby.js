/* global Phaser, Game */

Game.states.lobby = function(game){};

Game.states.lobby.prototype.create = function(){
  console.log('lobby');

  this.addTitles();

  this.game.input.onDown.add(function(){ this.game.state.start('play'); }, this);
  this.game.input.keyboard.onDownCallback = function(evt){
    if(this.game.input.keyboard.event.keyCode === Phaser.Keyboard.ENTER){
      this.game.state.start('play');
    }
  };
};

Game.states.lobby.prototype.addTitles = function(){
  var delay = 400;
  var tweenTime = 750;

  var title = this.game.add.text(0, 0, 'Phaserload', { font: '48px '+ Game.config.font, fill: Game.config.textColor });
  title.x = this.game.width/2 - title.getBounds().width/2;
  title.alpha = 0;

  var text = this.game.add.text(0, this.game.height, '[enter] or tap to begin', { font: '40px '+ Game.config.font, fill: Game.config.textColor });
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;

  this.game.add.tween(title).to({ y: ((this.game.height / 4) * 2) - 148 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay);
  this.game.add.tween(title).to({ alpha: 1 }, tweenTime - 100, Phaser.Easing.Sinusoidal.InOut, true, delay);

  this.game.add.tween(text).to({ y: (this.game.height / 4) * 2 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay + 200);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime - 100, Phaser.Easing.Sinusoidal.InOut, true, delay + 200);
};