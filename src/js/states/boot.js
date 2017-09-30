/* global Phaser, Game */

Game.states.boot = function(game){};

Game.states.boot.prototype.preload = function(){
  this.game.load.image('preloader-icon', '/assets/preloader/preloader-icon.png');
  this.game.load.image('preloader-bg', '/assets/preloader/preloader-bg.png');
  this.game.load.image('preloader-fg', '/assets/preloader/preloader-fg.png');
};

Game.states.boot.prototype.create = function(){
  console.log('boot');

  this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  this.game.scale.pageAlignHorizontally = true;
  this.game.scale.pageAlignVertically = true;

  this.game.add.text(10, 10, '...', { font: '100px '+ Game.config.font, fill: Game.config.textColor });

  this.game.state.start('load');
};