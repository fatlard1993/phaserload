/* global Phaser, Game */

Game.states.load = function(game){};

Game.states.load.prototype.preload = function(){
  var preloadIcon = this.game.add.sprite(0, 0, 'preloader-icon');
  preloadIcon.y = this.game.height/2 - preloadIcon.height - 20;
  preloadIcon.x = this.game.width/2 - preloadIcon.width/2;

  var preloadBg = this.game.add.sprite(0, 0, 'preloader-bg');
  preloadBg.y = this.game.height/2 - preloadBg.height/2;
  preloadBg.x = this.game.width/2 - preloadBg.width/2;

  var preloadFg = this.game.add.sprite(0, 0, 'preloader-fg');
  preloadFg.y = this.game.height/2 - preloadFg.height/2;
  preloadFg.x = this.game.width/2 - preloadFg.width/2;

  this.game.load.setPreloadSprite(preloadFg);

  this.game.load.spritesheet('hud', '/assets/hud.png', 320, 256);
  this.game.load.spritesheet('spaceco', '/assets/spaceco.png', 704, 448);
  this.game.load.spritesheet('ground', '/assets/ground.png', 64, 64, 4);
  this.game.load.spritesheet('ground_blue', '/assets/ground_blue.png', 64, 64, 4);
  this.game.load.spritesheet('ground_green', '/assets/ground_green.png', 64, 64, 4);
  this.game.load.spritesheet('ground_purple', '/assets/ground_purple.png', 64, 64, 4);
  this.game.load.spritesheet('ground_teal', '/assets/ground_teal.png', 64, 64, 4);
  this.game.load.spritesheet('ground_red', '/assets/ground_red.png', 64, 64, 4);
  this.game.load.spritesheet('drill', '/assets/drill.png', 64, 64);
  this.game.load.spritesheet('lava', '/assets/lava.png', 64, 64);
  this.game.load.spritesheet('monster', '/assets/monster.png', 64, 64);
};

Game.states.load.prototype.create = function(){
  this.game.stage.backgroundColor = Game.config.backgroundColor;

  // Delay is to allow web fonts to load
  Game.fadeOut(1000, Game.config.backgroundColor);

  this.game.time.events.add(1000, function(){

    console.log('load');    

    this.game.state.start('lobby');
  }, this);
};

Game.states.load.prototype.update = function(){};