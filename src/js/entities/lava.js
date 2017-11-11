/* global Phaser, Game */

Game.entities.lava = function(x, y){
  Phaser.Sprite.call(this, Game.game, x, y, 'lava');

  this.anchor.setTo(0.5, 0.5);

  var fillingAnim = this.animations.add('filling', [0, 1, 2], 3, false);
  fillingAnim.onComplete.add(function(){
    this.play('full');

    this.full = true;

    var gridPos = {
      x: Game.toGridPos(this.x),
      y: Game.toGridPos(this.y)
    };

    if(gridPos.x - 1 > 0 && (!Game.mapPosName(gridPos.x - 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x - 1, gridPos.y)))){
      Game.entities.lava.create(this.x - Game.blockPx, this.y, 1);
    }

    if(gridPos.x + 1 < Game.config.width && (!Game.mapPosName(gridPos.x + 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x + 1, gridPos.y)))){
      Game.entities.lava.create(this.x + Game.blockPx, this.y, 1);
    }

    if(gridPos.y + 1 > 0 && (!Game.mapPosName(gridPos.x, gridPos.y + 1) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x, gridPos.y + 1)))){
      Game.entities.lava.create(this.x, this.y + Game.blockPx, 1);
    }
  }, this);

  this.animations.add('full', [3, 4, 5], 10, true);
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

Game.entities.lava.create = function(x, y, isNew){
  var lava = Game.lava.getFirstDead();

  if(!lava){
    lava = Game.lava.add(new Game.entities.lava(x, y));
  }
  else{
    lava.reset(x, y);
    lava.revive();
    lava.animations.stop();
  }

  if(isNew){
    var gridPos = {
      x: Game.toGridPos(x),
      y: Game.toGridPos(y)
    };

    Game.config.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('lava');
    Game.config.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('lava');

    lava.full = false;

    lava.animations.play('filling');
  }
  else{
    lava.full = true;

    lava.animations.play('full');
  }

  return lava;
};

Game.entities.lava.spread = function(x, y){
  Game.lava.forEachAlive(function(lava){
    if(Game.game.math.distance(lava.x, lava.y, x, y) < Game.blockPx){
      var gridPos = {
        x: Game.toGridPos(lava.x),
        y: Game.toGridPos(lava.y)
      };

      if(gridPos.x - 1 >= 0 && (!Game.mapPosName(gridPos.x - 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x - 1, gridPos.y)))){
        Game.entities.lava.create(x - Game.blockPx, y, 1);
      }

      if(gridPos.x + 1 < Game.config.width && (!Game.mapPosName(gridPos.x + 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x + 1, gridPos.y)))){
        Game.entities.lava.create(x + Game.blockPx, y, 1);
      }

      if(gridPos.y + 1 < Game.config.depth - 2 && (!Game.mapPosName(gridPos.x, gridPos.y + 1) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x, gridPos.y + 1)))){
        Game.entities.lava.create(x, y + Game.blockPx, 1);
      }
    }
  });
};