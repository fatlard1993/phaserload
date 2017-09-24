/* global Phaser, Game */

Game.entities.player = function(){};

Game.entities.player.create = function(game, x, y){
  Game.drill = game.add.sprite(x, y, 'drill', 12);
  
  Game.drill.anchor.setTo(0.5, 0.5);

  Game.drill.animations.add('right', [0, 1, 2], 10, true);
  Game.drill.animations.add('left', [3, 4, 5], 10, true);
  Game.drill.animations.add('down', [6, 7, 8], 10, true);
  Game.drill.animations.add('up', [9, 10, 11], 10, true);

  Game.drill.animations.play('right');

  return Game.drill;
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
  console.log('Drill: On the move, goin: ', direction);

  var surrounds = Game.entities.player.getSurrounds();

  if(direction === 'left' && Game.drill.x < Game.config.blockSize/2){
    return;
  }
  else if(direction === 'right' && Game.drill.x > game.width - Game.config.blockSize/2){
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
  
  Game.drill.animations.play(direction);
  
  var newPosition = {
    x: Game.drill.x + (direction === 'left' ? -Game.config.blockSize : direction === 'right' ? Game.config.blockSize : 0),
    y: Game.drill.y + (direction === 'up' ? -Game.config.blockSize : direction === 'down' ? Game.config.blockSize : 0)
  };
    
  //keep camera with player
  if(direction === 'up' && newPosition.y < Game.drill.y && newPosition.y <= game.camera.y + Game.config.blockMiddle){
    game.add.tween(game.camera).to({ y: game.camera.y - Game.config.blockSize }, Game.config.drillMoveSpeed, Phaser.Easing.Sinusoidal.InOut, true);
  }
  else if(direction === 'down' && newPosition.y > Game.drill.y && newPosition.y >= game.camera.y + Game.config.blockMiddle){
    game.add.tween(game.camera).to({ y: game.camera.y + Game.config.blockSize }, Game.config.drillMoveSpeed, Phaser.Easing.Sinusoidal.InOut, true);
  }

  var targetGroundType = Game.groundAt(newPosition.x, newPosition.y);

  if(targetGroundType){
    console.log('Drill: Im diggin here! ', targetGroundType, newPosition);
    Game.entities.ground.dig(newPosition);
  }
  
  game.add.tween(Game.drill).to(newPosition, targetGroundType ? Game.config.digTime[targetGroundType] : Game.config.drillMoveSpeed, Phaser.Easing.Sinusoidal.InOut, true);


  var invertTexture = false;
  if(direction === 'up' && surrounds.right && (!surrounds.left || Game.entities.player.lastMoveInvert)){
    invertTexture = true;
  }
  else if(direction === 'down' && (surrounds.right && !surrounds.left || Game.entities.player.lastMoveInvert || Game.entities.player.lastMove === 'left')){
    invertTexture = true;    
  }


  if(invertTexture){  
    console.log('Drill: Inverting texture!');
    Game.drill.scale.x = -Game.drillScaleX;
  }
  else{
    Game.drill.scale.x = Game.drillScaleX;
  }
  
  console.log('playing animation: ', direction, Game.drill.scale.x);

  
  Game.entities.player.lastMoveInvert = invertTexture;
  Game.entities.player.lastMove = direction;

  Game.entities.player.lastPosition = newPosition;
  
  
  Game.depth = (newPosition.y - Game.config.blockMiddle) / Game.config.blockSize;
  
  Game.greenScore -= 0.1;//Game.chance(40) ? 0 : 1;

  Game.depthText.setText('Depth: ' + Game.depth);
  
  Game.blueScoreText.setText('Armor: '+ Game.blueScore);
  Game.greenScoreText.setText('Fuel: '+ Game.greenScore.toFixed(1));
  // Game.purpleScoreText.setText('Purple: '+ Game.purpleScore);
  // Game.tealScoreText.setText('Teal: '+ Game.tealScore);
};