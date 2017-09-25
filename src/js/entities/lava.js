/* global Phaser, Game */

Game.entities.lava = function(game, x, y){
  Phaser.Sprite.call(this, game, x, y, 'lava');

  this.anchor.setTo(0.5, 0.5);

  var fillingAnim = this.animations.add('filling', [0, 1, 2], 3, false);
  fillingAnim.onComplete.add(function(){ this.play('full'); }, this);
  this.animations.add('full', [3, 4, 5], 10, true);
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

Game.entities.lava.prototype.update = function(){
  if(!this.alive) return;

  if(this.animations.getAnimation('full').isPlaying){
    this.lethal = true;
    var canMoveRight = true;
    var canMoveLeft = true;
    var canMoveDown = true;

    Game.ground.forEachAlive(function(ground){
      if(ground.y === this.y && ground.x === this.x + Game.config.blockSize) canMoveRight = false;
      if(ground.y === this.y && ground.x === this.x - Game.config.blockSize) canMoveLeft = false;
      if(ground.x === this.x && ground.y === this.y + Game.config.blockSize) canMoveDown = false;
    }, this);

    Game.lava.forEachAlive(function(lava){
      if(lava.y === this.y && lava.x === this.x + Game.config.blockSize) canMoveRight = false;
      if(lava.y === this.y && lava.x === this.x - Game.config.blockSize) canMoveLeft = false;
      if(lava.x === this.x && lava.y === this.y + Game.config.blockSize) canMoveDown = false;
    }, this);

    if(canMoveRight && this.x < this.game.width - Game.config.blockSize/2){
      Game.entities.lava.create(this.game, this.x + Game.config.blockSize, this.y);
    }

    if(canMoveLeft && this.x > Game.config.blockSize/2){
      Game.entities.lava.create(this.game, this.x - Game.config.blockSize, this.y);
    }

    if(canMoveDown && this.y < this.game.camera.y + this.game.camera.height){
      Game.entities.lava.create(this.game, this.x, this.y + Game.config.blockSize);
    }
  }
};

Game.entities.lava.create = function(game, x, y){
  var lava = Game.lava.getFirstDead();
  if(lava === null){
    lava = Game.lava.add(new Game.entities.lava(game, x, y));
  }

  lava.reset(x, y);
  lava.lethal = false;
  lava.revive();
  
  lava.animations.stop();
  lava.animations.play('filling');

  return lava;
};
