/* global Phaser, Game */

Game.entities.lava = function(x, y){
  Phaser.Sprite.call(this, Game.game, x, y, 'lava');

  this.anchor.setTo(0.5, 0.5);

  var fillingAnim = this.animations.add('filling', [0, 1, 2], 3, false);
  fillingAnim.onComplete.add(function(){
    this.play('full');

    this.lethal = true;

    var gridPos = {
      x: Game.toGridPos(this.x),
      y: Game.toGridPos(this.y)
    };

    if(Game.map[gridPos.x - 1] && Game.map[gridPos.x - 1][gridPos.y][0] < 2){
      Game.entities.lava.create(this.x - Game.blockPx, this.y, 1);
    }
    
    if(Game.map[gridPos.x + 1] && Game.map[gridPos.x + 1][gridPos.y][0] < 2){
      Game.entities.lava.create(this.x + Game.blockPx, this.y, 1);
    }

    if(Game.map[gridPos.x][gridPos.y + 1] && Game.map[gridPos.x][gridPos.y + 1][0] < 2){
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
    
    Game.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('lava');
    Game.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('lava');
    
    lava.lethal = false;

    lava.animations.play('filling');
  }
  else{
    lava.lethal = true;
    
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
  
      if(Game.map[gridPos.x - 1] && Game.map[gridPos.x - 1][gridPos.y][0] < 2){
        Game.entities.lava.create(lava.x - Game.blockPx, lava.y, 1);
      }
      
      if(Game.map[gridPos.x + 1] && Game.map[gridPos.x + 1][gridPos.y][0] < 2){
        Game.entities.lava.create(lava.x + Game.blockPx, lava.y, 1);
      }
  
      if(Game.map[gridPos.x][gridPos.y + 1] && Game.map[gridPos.x][gridPos.y + 1][0] < 2){
        Game.entities.lava.create(lava.x, lava.y + Game.blockPx, 1);
      }
    }
  });
};