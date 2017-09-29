/* global Phaser, Game */

Game.entities.player = function(){};

Game.entities.player.create = function(game, x, y){
  Game.drill = game.add.sprite(x, y, 'drill', 15);
  
  Game.drill.anchor.setTo(0.5, 0.5);

  Game.drill.animations.add('alive', [0, 1, 2], 10, true);
  Game.drill.animations.add('upgraded', [3, 4, 5], 10, true);
  Game.drill.animations.add('upgradedx2', [6, 7, 8], 10, true);
  Game.drill.animations.add('upgradedx3', [9, 10, 11], 10, true);
  Game.drill.animations.add('teleporting', [12, 13, 14], 10, true);
  // teleportationAnim.onComplete.add(function(){
  //   Game.drill.animations.play('alive');
  // });

  Game.drill.animations.play('alive');

  Game.map[Game.toGridPos(Game.drill.x)][Game.toGridPos(Game.drill.y)] = Game.mapNames.indexOf('player1');

  Game.drillScaleX = Game.drill.scale.x;  
};

Game.entities.player.getSurrounds = function(){
  return {
    left: Game.groundAt(Game.drill.x - Game.config.blockSize, Game.drill.y),
    topLeft: Game.groundAt(Game.drill.x - Game.config.blockSize, Game.drill.y - Game.config.blockSize),
    top: Game.groundAt(Game.drill.x, Game.drill.y - Game.config.blockSize),
    topRight: Game.groundAt(Game.drill.x + Game.config.blockSize, Game.drill.y - Game.config.blockSize),
    right: Game.groundAt(Game.drill.x + Game.config.blockSize, Game.drill.y),
    bottomRight: Game.groundAt(Game.drill.x + Game.config.blockSize, Game.drill.y + Game.config.blockSize),
    bottom: Game.groundAt(Game.drill.x, Game.drill.y + Game.config.blockSize),
    bottomLeft: Game.groundAt(Game.drill.x - Game.config.blockSize, Game.drill.y + Game.config.blockSize)
  };
};

Game.entities.player.move = function(game, direction){
  // console.log('Drill: On the move, goin: ', direction);

  if(direction === 'up' && Game.spacecoOffered){
    return Game.enterSapceco();
  }

  var surrounds = Game.entities.player.getSurrounds();

  if(direction === 'left' && (Game.drill.x <= Game.config.blockSize/2 || (!surrounds.bottomLeft && !surrounds.bottom))){
    return;
  }
  else if(direction === 'right' && (Game.drill.x >= game.width - Game.config.blockSize/2 || (!surrounds.bottomRight && !surrounds.bottom))){
    return;
  }
  else if(direction === 'down'){
    // return;
  }
  else if(direction === 'up' && (!surrounds.left && !surrounds.right)){
    return;
  }

  if(Game.entities.player.justMoved_TO){
    clearTimeout(Game.entities.player.justMoved_TO);
    Game.entities.player.justMoved_TO = null;
  }
  if(!Game.entities.player.justMoved_TO){
    Game.entities.player.justMoved = true;
    Game.entities.player.justMoved_TO = setTimeout(function(){
      Game.entities.player.justMoved = false;
    }, 500);
  }
  
  // Game.drill.animations.play(direction);
  
  var newPosition = {
    x: Game.drill.x + (direction === 'left' ? -Game.config.blockSize : direction === 'right' ? Game.config.blockSize : 0),
    y: Game.drill.y + (direction === 'up' ? -Game.config.blockSize : direction === 'down' ? Game.config.blockSize : 0)
  };
  var targetGroundType = Game.groundAt(newPosition.x, newPosition.y);
  var moveTime = targetGroundType ? Game.config.digTime[Game.config.mode][targetGroundType] ? Game.config.digTime[Game.config.mode][targetGroundType] : Game.config.drillMoveTime[Game.config.mode] : Game.config.drillMoveTime[Game.config.mode];

  if(direction === 'teleport'){
    Game.drill.animations.play('teleporting');

    moveTime = Math.ceil(Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y));

    setTimeout(function(){
      Game.drill.animations.play('alive');
      Game.offerSpaceco();
    }, 200 + moveTime);

    game.add.tween(game.camera).to({ y: 0 }, moveTime, Phaser.Easing.Sinusoidal.InOut, true);
    
    newPosition.x = Game.spaceco.x;
    newPosition.y = Game.spaceco.y;
  }
  else if(direction === 'up'){
    game.add.tween(game.camera).to({ y: game.camera.y - Game.config.blockSize }, moveTime, Phaser.Easing.Sinusoidal.InOut, true);
  }
  else if(direction === 'down'){
    game.add.tween(game.camera).to({ y: game.camera.y + Game.config.blockSize }, moveTime, Phaser.Easing.Sinusoidal.InOut, true);
  }

  if(targetGroundType){
    console.log('Drill: Im diggin here! ', targetGroundType, newPosition);

    if(targetGroundType.startsWith('mineral') && Game.hull.space > 0){
      Game.minerals.forEachAlive(function(mineral){
        if(mineral.x === newPosition.x && mineral.y === newPosition.y){
          Game.hull[mineral.type] = Game.hull[mineral.type] || 0;
          
          Game.hull[mineral.type]++;

          Game.hull.space -= 1;

          mineral.kill();
    
          Game.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)] = 0;
        }
      });
    }

    else Game.entities.ground.dig(newPosition);
  }
  
  game.add.tween(Game.drill).to(newPosition, moveTime, Phaser.Easing.Sinusoidal.InOut, true);


  var invertTexture = false;

  if(direction === 'up'){
    if(surrounds.left){//&& (!surrounds.left || Game.entities.player.lastMoveInvert)
      invertTexture = true;
      Game.drill.angle = 90;
    }
    else Game.drill.angle = -90;
  }
  else if(direction === 'down'){
    if(surrounds.right){//&& !surrounds.left || Game.entities.player.lastMoveInvert || Game.entities.player.lastMove === 'left')
      invertTexture = true;
      Game.drill.angle = -90;
    }
    else Game.drill.angle = 90;
  }
  else{
    Game.drill.angle = 0;    
  }

  if(direction === 'left'){
    invertTexture = true;
  }


  if(invertTexture){  
    // console.log('Drill: Inverting texture!');
    Game.drill.scale.x = -Game.drillScaleX;
  }
  else{
    Game.drill.scale.x = Game.drillScaleX;   
  }
  
  // console.log('playing animation: ', direction, Game.drill.scale.x);

  Game.entities.player.lastMoveInvert = invertTexture;
  Game.entities.player.lastMove = direction;

  Game.entities.player.lastPosition = newPosition;
  
  Game.map[Game.toGridPos(Game.drill.x)][Game.toGridPos(Game.drill.y)] = 0;
  Game.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)] = Game.mapNames.indexOf('player1');
  
  Game.depth = (newPosition.y - Game.config.blockMiddle) / Game.config.blockSize;

  if(!Game.spacecoOffered && Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y) < Game.config.blockSize + 10){
    Game.offerSpaceco();
  }
  else if(Game.spacecoOffered && Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y) > Game.config.blockSize - 10){
    Game.revokeSpaceco();
  }

  if(Game.config.mode === 'normal'){
    Game.fuel -= 0.1;
  }

  Game.updateHud();

  Game.upkeepView();
};
