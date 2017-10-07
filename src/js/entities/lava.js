/* global Phaser, Game */

Game.entities.lava = function(game, x, y){
  Phaser.Sprite.call(this, game, x, y, 'lava');

  this.anchor.setTo(0.5, 0.5);

  var fillingAnim = this.animations.add('filling', [0, 1, 2], 3, false);
  fillingAnim.onComplete.add(function(){
    this.play('full');

    this.lethal = true;

    var gridPos = {
      x: Game.toGridPos(this.x),
      y: Game.toGridPos(this.y)
    };

    var slotId = Game.map[gridPos.x][gridPos.y][0];
  
    if(slotId < 3){
      Game.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('lava');
      Game.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('lava');
    }

    var spread = {
      left: this.x > Game.blockPx / 2 && Game.map[gridPos.x - 1][gridPos.y][0] < 3 ? 1 : 0,
      right: this.x < this.game.width - Game.blockPx / 2 && Game.map[gridPos.x + 1][gridPos.y][0] < 3 ? 1 : 0,
      down: Game.map[gridPos.x][gridPos.y + 1][0] < 3 ? 1 : 0
    };

    if(spread.left){
      Game.entities.lava.create(this.game, this.x - Game.blockPx, this.y);
    }

    if(spread.right){
      Game.entities.lava.create(this.game, this.x + Game.blockPx, this.y);
    }

    if(spread.down){
      Game.entities.lava.create(this.game, this.x, this.y + Game.blockPx);
    }
  }, this);
  this.animations.add('full', [3, 4, 5], 10, true);
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

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