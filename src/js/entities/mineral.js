/* global Phaser, Game */

Game.entities.mineral = function(game, x, y){
  Phaser.Sprite.call(this, game, x, y, 'mineral');

  this.anchor.setTo(0.5, 0.5);
};

Game.entities.mineral.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.mineral.prototype.constructor = Game.entities.mineral;

Game.entities.mineral.create = function(game, x, y, type){
  var mineral = Game.minerals.getFirstDead();
  
  if(mineral === null){
    mineral = Game.minerals.add(new Game.entities.mineral(game, x, y));
  }
  else{
    mineral.reset(x, y);
    mineral.revive();
  }
  
  mineral.frame = type === 'mineral_green' ? 0 : type === 'mineral_red' ? 1 : 2;
  mineral.type = type;

  var gridPos = {
    x: Game.toGridPos(x),
    y: Game.toGridPos(y)
  };

  // Game.map[gridPos.x][gridPos.y] = Game.mapNames.indexOf('mineral');

  return mineral;
};
