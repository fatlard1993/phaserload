/* global Phaser, Game */

Game.entities.monster = function(game, x, y){
  Phaser.Sprite.call(this, game, x, y, 'monster');

  this.anchor.setTo(0.5, 0.5);

  this.animations.add('default', [0, 1, 2], 10, true);
  this.animations.play('default');
};

Game.entities.monster.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.monster.prototype.constructor = Game.entities.monster;

Game.entities.monster.prototype.update = function(){
  if(!this.alive) return;

  if(!this.game.tweens.isTweening(this)){
    var canMoveRight = true;
    var canMoveLeft = true;
    var canMoveDown = true;
    var canMoveUp = true;

    Game.ground.forEachAlive(function(ground){
      if(ground.y === this.y && ground.x === this.x + Game.blockPx) canMoveRight = false;
      if(ground.y === this.y && ground.x === this.x - Game.blockPx) canMoveLeft = false;
      if(ground.x === this.x && ground.y === this.y + Game.blockPx) canMoveDown = false;
      if(ground.x === this.x && ground.y === this.y - Game.blockPx) canMoveUp = false;
    }, this);

    Game.lava.forEachAlive(function(lava){
      if(lava.y === this.y && lava.x === this.x + Game.blockPx) canMoveRight = false;
      if(lava.y === this.y && lava.x === this.x - Game.blockPx) canMoveLeft = false;
      if(lava.x === this.x && lava.y === this.y + Game.blockPx) canMoveDown = false;
      if(lava.x === this.x && lava.y === this.y - Game.blockPx) canMoveUp = false;
    }, this);

    if(this.y <= Game.blockPx * 3.5) canMoveUp = false; // So many magic numbers!

    if(Game.drill.y < this.y){
      canMoveDown = false;
    }
    else if(Game.drill.y > this.y){
      canMoveUp = false;
    }
    else if(Game.drill.y === this.y){
      canMoveUp = false;
      canMoveDown = false;
    }
    if(Game.drill.x < this.x){
      canMoveRight = false;
    }
    else if(Game.drill.x > this.x){
      canMoveLeft = false;
    }
    else{
      canMoveRight = false;
      canMoveLeft = false;
    }

    var moved = false;
    var wakeupDelay = 600;
    var stepDelay = 300;
    var moveSpeed = 400;

    var delay = stepDelay;
    if(this.firstMove) delay += wakeupDelay;

    var gridPos = {
      x: Game.toGridPos(this.x),
      y: Game.toGridPos(this.y)
    };

    Game.viewBufferMap[gridPos.x][gridPos.y][0] = -1;
    Game.map[gridPos.x][gridPos.y][0] = -1;

    if(canMoveRight && this.x < this.game.width - Game.blockPx/2){
      this.game.add.tween(this).to({ x: this.x + Game.blockPx }, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, delay);

      var newGridPos = {
        x: Game.toGridPos(this.x + Game.blockPx),
        y: Game.toGridPos(this.y)
      };

      Game.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');
      Game.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');

      moved = true;
    }
    else if(canMoveLeft && this.x > Game.blockPx/2){
      this.game.add.tween(this).to({ x: this.x - Game.blockPx }, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, delay);
      
      var newGridPos = {
        x: Game.toGridPos(this.x - Game.blockPx),
        y: Game.toGridPos(this.y)
      };

      Game.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');
      Game.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');

      moved = true;
    }
    else if(canMoveDown && this.y < this.game.camera.y + this.game.camera.height){
      this.game.add.tween(this).to({ y: this.y + Game.blockPx }, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, delay);

      var newGridPos = {
        x: Game.toGridPos(this.x),
        y: Game.toGridPos(this.y + Game.blockPx)
      };

      Game.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');
      Game.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');

      moved = true;
    }
    else if(canMoveUp && this.y > this.game.camera.y){
      this.game.add.tween(this).to({ y: this.y - Game.blockPx }, moveSpeed, Phaser.Easing.Sinusoidal.InOut, true, delay);

      var newGridPos = {
        x: Game.toGridPos(this.x),
        y: Game.toGridPos(this.y - Game.blockPx)
      };

      Game.viewBufferMap[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');
      Game.map[gridPos.x][gridPos.y][0] = Game.mapNames.indexOf('monster');

      moved = true;
    }

    if(moved){
      if(this.firstMove){
      }
      this.firstMove = false;
    }
  }
};

Game.entities.monster.create = function(game, x, y){
  var monster;
  monster = Game.monsters.getFirstDead();

  if(monster === null){
    monster = Game.monsters.add(new Game.entities.monster(game, x, y));
  }
  
  monster.reset(x, y);
  monster.revive();
  monster.firstMove = true;

  monster.animations.play('default');

  return monster;
};
