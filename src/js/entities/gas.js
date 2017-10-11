/* global Phaser, Game */

Game.entities.gas = function(x, y){
  Phaser.Sprite.call(this, Game.game, x, y, 'gas');

  this.anchor.setTo(0.5, 0.5);

  var fillingAnim = this.animations.add('filling', [2, 1, 0], 3, false);
  fillingAnim.onComplete.add(function(){
    this.play('full');

    this.full = true;

    var gridPos = {
      x: Game.toGridPos(this.x),
      y: Game.toGridPos(this.y)
    };

    if(gridPos.x - 1 > 0 && (!Game.mapPosName(gridPos.x - 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x - 1, gridPos.y)))){
      Game.entities.gas.create(this.x - Game.blockPx, this.y, 1);
    }
    
    else if(gridPos.x + 1 < Game.width && (!Game.mapPosName(gridPos.x + 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x + 1, gridPos.y)))){
      Game.entities.gas.create(this.x + Game.blockPx, this.y, 1);
    }

    if(gridPos.y - 1 > 0 && (!Game.mapPosName(gridPos.x, gridPos.y - 1) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x, gridPos.y - 1)))){
      Game.entities.gas.create(this.x, this.y - Game.blockPx, 1);
    }

    this.play('dissipate');    
  }, this);

  var dissipateAnim = this.animations.add('dissipate', [0, 1, 2], 3, false);
  dissipateAnim.onComplete.add(function(){
    this.kill();

    Game.viewBufferMap[Game.toGridPos(this.x)][Game.toGridPos(this.y)][0] = -1;
    Game.map[Game.toGridPos(this.x)][Game.toGridPos(this.y)][0] = -1;
  }, this);

  this.animations.add('full', [3, 4, 5], 10, true);
};

Game.entities.gas.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.gas.prototype.constructor = Game.entities.gas;

Game.entities.gas.create = function(x, y, isNew){
  var gas = Game.gas.getFirstDead();

  if(!gas){
    gas = Game.gas.add(new Game.entities.gas(x, y));
  }
  else{
    gas.reset(x, y);
    gas.revive();
    gas.animations.stop();
  }
  
  if(isNew){
    var gridPos = {
      x: Game.toGridPos(x),
      y: Game.toGridPos(y)
    };
    
    Game.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('gas');
    Game.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('gas');
    
    gas.full = false;

    gas.animations.play('filling');
  }
  else{
    gas.full = true;
    
    gas.animations.play('full');
  }

  return gas;
};

Game.entities.gas.spread = function(x, y){
  Game.gas.forEachAlive(function(gas){
    if(Game.game.math.distance(gas.x, gas.y, x, y) < Game.blockPx){
      var gridPos = {
        x: Game.toGridPos(gas.x),
        y: Game.toGridPos(gas.y)
      };

      var spread;

      if(gridPos.x - 1 > 0 && (!Game.mapPosName(gridPos.x - 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x - 1, gridPos.y)))){
        Game.entities.gas.create(x - Game.blockPx, y, 1);
        spread = 1;
      }
      
      else if(gridPos.x + 1 < Game.width && (!Game.mapPosName(gridPos.x + 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x + 1, gridPos.y)))){
        Game.entities.gas.create(x + Game.blockPx, y, 1);
        spread = 1;
      }
  
      if(gridPos.y - 1 > 0 && (!Game.mapPosName(gridPos.x, gridPos.y - 1) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x, gridPos.y - 1)))){
        Game.entities.gas.create(x, y - Game.blockPx, 1);
        spread = 1;
      }

      if(spread) gas.play('dissipate');
    }
  });
};