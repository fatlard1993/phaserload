/* global Phaser, Game */

Game.entities.lava = function(x, y){
  Phaser.Sprite.call(this, Game.game, x, y, 'lava');

  this.anchor.setTo(0.5, 0.5);

  return this;
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

Game.entities.lava.create = function(x, y, isNew){
  var placeLocation = Game.mapPosName(Game.toGridPos(x), Game.toGridPos(y));
  if(placeLocation && placeLocation === 'lava') return;

  var lava = Game.lava.getFirstDead();

  if(!lava){
    lava = Game.lava.add(new Game.entities.lava(x, y));

    var fillingAnim = lava.animations.add('filling', [0, 1, 2], 3, false);
    fillingAnim.onComplete.add(function(){
      lava.play('full');

      lava.full = true;

      Game.entities.lava.spread(lava.x, lava.y);
    }, lava);

    lava.animations.add('full', [3, 4, 5], 10, true);
  }
  else{
    lava.reset(x, y);
    lava.revive();
    lava.animations.stop();
  }

  if(isNew){
    Game.setMapPos({ x: x, y: y }, Game.mapNames.indexOf('lava'));

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
    if(lava.full && !lava.done && Game.game.math.distance(lava.x, lava.y, x, y) < Game.blockPx){
      var gridPos = {
        x: Game.toGridPos(lava.x),
        y: Game.toGridPos(lava.y)
      };

      if(gridPos.x - 1 >= 0 && (!Game.mapPosName(gridPos.x - 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x - 1, gridPos.y)))){
        Game.entities.lava.create(x - Game.blockPx, y, 1);
        lava.done = 1;
      }

      if(gridPos.x + 1 < Game.config.width && (!Game.mapPosName(gridPos.x + 1, gridPos.y) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x + 1, gridPos.y)))){
        Game.entities.lava.create(x + Game.blockPx, y, 1);
        lava.done = 1;
      }

      if(gridPos.y + 1 < Game.config.depth - 2 && (!Game.mapPosName(gridPos.x, gridPos.y + 1) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x, gridPos.y + 1)))){
        Game.entities.lava.create(x, y + Game.blockPx, 1);
        lava.done = 1;
      }
    }
  });
};