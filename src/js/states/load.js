/* global Phaser, Game */

Game.states.load = function(game){};

Game.states.load.prototype.preload = function(){
  this.game.load.spritesheet('hud', '/assets/hud.png', 320, 256);
  this.game.load.spritesheet('itemSlot', '/assets/itemSlot.png', 128, 64, 2);
  this.game.load.spritesheet('spaceco', '/assets/spaceco.png', 704, 448);
  this.game.load.spritesheet('teleporter', '/assets/teleporter.png', 32, 32);
  this.game.load.spritesheet('responder', '/assets/responder.png', 32, 32, 2);
  this.game.load.spritesheet('responder_teleporter', '/assets/responder_teleporter.png', 32, 32);
  this.game.load.spritesheet('repair', '/assets/repair.png', 32, 32);
  this.game.load.spritesheet('tombstone', '/assets/tombstone.png', 32, 32);
  this.game.load.spritesheet('detonator', '/assets/detonator.png', 32, 32, 3);
  this.game.load.spritesheet('explosives', '/assets/explosives.png', 32, 32, 8);
  this.game.load.spritesheet('fuel', '/assets/fuel.png', 32, 32, 3);
  this.game.load.spritesheet('upgrade', '/assets/upgrades.png', 32, 32, 3);
  this.game.load.spritesheet('mineral', '/assets/minerals.png', 32, 32, 3);
  this.game.load.spritesheet('ground', '/assets/ground.png', 64, 64, 40);
  this.game.load.spritesheet('drill', '/assets/drill.png', 64, 64);
  this.game.load.spritesheet('lava', '/assets/lava.png', 64, 64);
  this.game.load.spritesheet('monster', '/assets/monster.png', 64, 64);
};

Game.states.load.prototype.create = function(){
  console.log('load');

  this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  this.game.scale.pageAlignHorizontally = true;
  this.game.scale.pageAlignVertically = true;

  this.game.stage.backgroundColor = Game.config.backgroundColor;

  this.game.state.start('lobby');
};