/* global Phaser, Game */

Game.states.boot = function(game){};

Game.states.boot.prototype.preload = function(){
  this.game.load.image('preloader-icon', '/assets/preloader/preloader-icon.png');
  this.game.load.image('preloader-bg', '/assets/preloader/preloader-bg.png');
  this.game.load.image('preloader-fg', '/assets/preloader/preloader-fg.png');
};

Game.states.boot.prototype.create = function(){
  this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  this.game.scale.width = Game.config.width;
  this.game.scale.height = Game.config.height;
  this.game.scale.maxWidth = Game.config.width;
  this.game.scale.maxHeight = Game.config.height;
  this.game.scale.pageAlignHorizontally = true;
  this.game.scale.pageAlignVertically = true;
  this.game.scale.refresh();
  this.game.stage.backgroundColor = Game.config.backgroundColor;

  this.game.add.text(10, 10, '...', { font: '100px '+ Game.config.font, fill: Game.config.textColor });

  console.log('boot');

  this.game.state.start('load');
};

Game.states.boot.prototype.update = function(){};
