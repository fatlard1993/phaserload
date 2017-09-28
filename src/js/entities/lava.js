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

    var slotId = Game.map[gridPos.x][gridPos.y];
  
    if(slotId < 3) Game.map[gridPos.x][gridPos.y] = Game.mapNames.indexOf('lava');

    var spread = {
      left: this.x > Game.config.blockSize / 2 && Game.map[gridPos.x - 1][gridPos.y] < 3 ? 1 : 0,
      right: this.x < this.game.width - Game.config.blockSize / 2 && Game.map[gridPos.x + 1][gridPos.y] < 3 ? 1 : 0,
      down: Game.map[gridPos.x][gridPos.y + 1] < 3 ? 1 : 0
    };

    if(spread.left){
      Game.entities.lava.create(this.game, this.x - Game.config.blockSize, this.y);
    }

    if(spread.right){
      Game.entities.lava.create(this.game, this.x + Game.config.blockSize, this.y);
    }

    if(spread.down){
      Game.entities.lava.create(this.game, this.x, this.y + Game.config.blockSize);
    }
  }, this);
  this.animations.add('full', [3, 4, 5], 10, true);
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

// Game.entities.lava.prototype.update = function(){
//   if(!this.alive || this.stuck) return;

//   if(this.animations.getAnimation('full').isPlaying){
//     this.lethal = true;

//     var gridPos = {
//       x: Game.toGridPos(this.x),
//       y: Game.toGridPos(this.y)
//     };

//     var surrounds = {
//       left: Game.map[gridPos.x - 1][gridPos.y],
//       right: Game.map[gridPos.x + 1][gridPos.y],
//       down: Game.map[gridPos.x][gridPos + 1]
//     };

//     var spread = {
//       left: this.x > Game.config.blockSize / 2 || surrounds.left > 2 ? 0 : 1,
//       right: this.x < this.game.width - Game.config.blockSize / 2 || surrounds.right > 2 ? 0 : 1,
//       down: 1
//     };


//     // if(surrounds.left && ![0, 'player1', 'monster'].includes(surrounds.left)) surrounds.left = 0;

//     // if(surrounds.right && ![0, 'player1', 'monster'].includes(surrounds.right)) surrounds.right = 0;

//     // if(surrounds.down && ![0, 'player1', 'monster'].includes(surrounds.down)) surrounds.down = 0;


//     // var canMoveRight = true;
//     // var canMoveLeft = true;
//     // var canMoveDown = true;

//     // Game.ground.forEachAlive(function(ground){
//     //   if(ground.y === this.y && ground.x === this.x + Game.config.blockSize) canMoveRight = false;
//     //   if(ground.y === this.y && ground.x === this.x - Game.config.blockSize) canMoveLeft = false;
//     //   if(ground.x === this.x && ground.y === this.y + Game.config.blockSize) canMoveDown = false;
//     // }, this);

//     // Game.lava.forEachAlive(function(lava){
//     //   if(lava.y === this.y && lava.x === this.x + Game.config.blockSize) canMoveRight = false;
//     //   if(lava.y === this.y && lava.x === this.x - Game.config.blockSize) canMoveLeft = false;
//     //   if(lava.x === this.x && lava.y === this.y + Game.config.blockSize) canMoveDown = false;
//     // }, this);

    
//     if(spread.left){//canMoveLeft && this.x > Game.config.blockSize/2){
//       Game.entities.lava.create(this.game, this.x - Game.config.blockSize, this.y);
//     }

//     if(spread.right){//canMoveRight && this.x < this.game.width - Game.config.blockSize/2){
//       Game.entities.lava.create(this.game, this.x + Game.config.blockSize, this.y);
//     }

//     if(spread.down){//canMoveDown && this.y < this.game.camera.y + this.game.camera.height){
//       Game.entities.lava.create(this.game, this.x, this.y + Game.config.blockSize);
//     }

//     if(!spread.left && !spread.right && !spread.down) this.stuck = true;
//   }
// };

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
