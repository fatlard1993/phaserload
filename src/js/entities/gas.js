/* global Phaser, Game */

Game.entities.gas = function(x, y){
  Phaser.Sprite.call(this, Game.game, x, y, 'gas');

  this.anchor.setTo(0.5, 0.5);
};

Game.entities.gas.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.gas.prototype.constructor = Game.entities.gas;

Game.entities.gas.create = function(x, y, isNew, spawnChance){
  if(isNew && spawnChance !== undefined && !Game.chance(spawnChance)) return;

  var gas = Game.gas.getFirstDead();

  if(!gas){
    gas = Game.gas.add(new Game.entities.gas(x, y));

    var fillingAnim = gas.animations.add('filling', [2, 1, 0], 3, false);
    fillingAnim.onComplete.add(function(){
      gas.play('full');

      gas.full = true;

      Game.entities.gas.spread(gas.x, gas.y);
    }, gas);

    var dissipateAnim = gas.animations.add('dissipate', [0, 1, 2], 3, false);
    dissipateAnim.onComplete.add(function(){
      gas.kill();

      Game.setMapPos({ x: gas.x, y: gas.y }, -1);
    }, gas);

    gas.animations.add('full', [3, 4, 5], 10, true);
  }
  else{
    gas.reset(x, y);
    gas.revive();
    gas.animations.stop();
  }

  if(isNew){
    Game.setMapPos({ x: x, y: y }, Game.mapNames.indexOf('gas'));

    gas.full = false;
    gas.spawnChance = spawnChance !== undefined ? spawnChance - Game.rand(0, 3) : 100;

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
    if(!gas.full && Game.game.math.distance(gas.x, gas.y, x, y) < Game.blockPx){
      var gridPos = {
        x: Game.toGridPos(gas.x),
        y: Game.toGridPos(gas.y)
      };

      var surrounds = {
        left: Game.mapPosName(gridPos.x - 1, gridPos.y),
        farLeft: Game.mapPosName(gridPos.x - (1 * 2), gridPos.y),
        topLeft: Game.mapPosName(gridPos.x - 1, gridPos.y - 1),
        top: Game.mapPosName(gridPos.x, gridPos.y - 1),
        topRight: Game.mapPosName(gridPos.x + 1, gridPos.y - 1),
        right: Game.mapPosName(gridPos.x + 1, gridPos.y),
        farRight: Game.mapPosName(gridPos.x + (1 * 2), gridPos.y),
        bottomRight: Game.mapPosName(gridPos.x + 1, gridPos.y + 1),
        bottom: Game.mapPosName(gridPos.x, gridPos.y + 1),
        bottomLeft: Game.mapPosName(gridPos.x - 1, gridPos.y + 1)
      };

      var canMoveRight = (gridPos.x + 1 < Game.config.width && (!surrounds.right || ['player1', 'monster'].includes(surrounds.right)));

      if((gridPos.x - 1 > 0 && (!surrounds.left || ['player1', 'monster'].includes(surrounds.left))) && (!canMoveRight || Game.chance())){
        Game.entities.gas.create(gas.x - Game.blockPx, gas.y, 1, gas.spawnChance);
      }

      else if(canMoveRight){
        Game.entities.gas.create(gas.x + Game.blockPx, gas.y, 1, gas.spawnChance);
      }

      if(gridPos.y - 1 > 0 && (!Game.mapPosName(surrounds.top) || ['player1', 'monster'].includes(Game.mapPosName(gridPos.x, gridPos.y - 1)))){
        Game.entities.gas.create(gas.x, gas.y - Game.blockPx, 1, gas.spawnChance);
      }

      gas.play('dissipate');
    }
  });
};