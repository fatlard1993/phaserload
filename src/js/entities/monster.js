/* global Phaser, Game */

Game.entities.monster = function(x, y){
  Phaser.Sprite.call(this, Game.game, x, y, 'monster');

  this.anchor.setTo(0.5, 0.5);

  this.animations.add('moving', [0, 1, 2], 10, true);
};

Game.entities.monster.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.monster.prototype.constructor = Game.entities.monster;

Game.entities.monster.prototype.update = function(){
  if(!this.alive || this.game.tweens.isTweening(this)) return;

  var gridPos = {
    x: Game.toGridPos(this.x),
    y: Game.toGridPos(this.y)
  };

  var moving;

  var xDiff = this.x - Game.drill.x;
  var yDiff = this.y - Game.drill.y;

  var xDirection = xDiff > 0 ? 'left' : 'right';
  var yDirection = yDiff > 0 ? 'up' : 'down';

  var wantToMove = Math.abs(xDiff) > Math.abs(yDiff) ? xDirection : yDirection;
  
  var canMove = {};
  
  if(gridPos.x - 1 > 0 && (!Game.mapPosName(gridPos.x - 1, gridPos.y) || ['player1', 'lava', 'gas'].includes(Game.mapPosName(gridPos.x - 1, gridPos.y)))){
    canMove.left = 1;
  }
  
  if(gridPos.x + 1 < Game.config.width && (!Game.mapPosName(gridPos.x + 1, gridPos.y) || ['player1', 'lava', 'gas'].includes(Game.mapPosName(gridPos.x + 1, gridPos.y)))){
    canMove.right = 1;
  }

  if(gridPos.y - 1 > 0 && (!Game.mapPosName(gridPos.x, gridPos.y - 1) || ['player1', 'lava', 'gas'].includes(Game.mapPosName(gridPos.x, gridPos.y - 1)))){
    canMove.up = 1;
  }

  if(gridPos.y + 1 > 0 && (!Game.mapPosName(gridPos.x, gridPos.y + 1) || ['player1', 'lava', 'gas'].includes(Game.mapPosName(gridPos.x, gridPos.y + 1)))){
    canMove.down = 1;
  }

  if(yDiff !== 0 && yDirection === 'up' && canMove.up){
    moving = { x: this.x, y: this.y - Game.blockPx };
  }

  else if(yDiff !== 0 && yDirection === 'down' && canMove.down){
    moving = { x: this.x, y: this.y + Game.blockPx };
  }

  else if(xDirection === 'left' && canMove.left){
    moving = { x: this.x - Game.blockPx, y: this.y };
  }

  else if(xDirection === 'right' && canMove.right){
    moving = { x: this.x + Game.blockPx, y: this.y };
  }

  if(!moving) return;

  this.justMoved = this.x !== moving.x ? (this.x - moving.x > 0 ? 'left' : 'right') : this.y !== moving.y > 0 ? 'up' : 'down';

  var moveDelay = 300;
  var moveSpeed = 400;

  if(!this.hadFirstMove){
    this.hadFirstMove = 1;
    moveDelay += 1000;
  }

  this.game.add.tween(this).to(moving, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, moveDelay);

  var newGridPos = {
    x: Game.toGridPos(moving.x),
    y: Game.toGridPos(moving.y)
  };

  Game.config.viewBufferMap[gridPos.x][gridPos.y][0] = -1;
  Game.config.map[gridPos.x][gridPos.y][0] = -1;
  
  Game.config.viewBufferMap[newGridPos.x][newGridPos.y][0] = Game.mapNames.indexOf('monster');
  Game.config.map[newGridPos.x][newGridPos.y][0] = Game.mapNames.indexOf('monster');
};

Game.entities.monster.create = function(x, y){
  var monster = Game.monsters.getFirstDead();

  if(monster === null){
    monster = Game.monsters.add(new Game.entities.monster(x, y));
  }
  else{
    monster.reset(x, y);
    monster.revive();
  }

  monster.animations.play('moving');

  return monster;
};