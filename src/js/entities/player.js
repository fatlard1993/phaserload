/* global Phaser, Game */

Game.entities.player = function(){};

Game.entities.player.create = function(game, x, y){
  Game.drill = game.add.sprite(x, y, 'drill', 15);
  
  Game.drill.anchor.setTo(0.5, 0.5);

  Game.drill.animations.add('normal', [0, 1, 2], 10, true);
  Game.drill.animations.add('upgraded', [3, 4, 5], 10, true);
  Game.drill.animations.add('upgradedx2', [6, 7, 8], 10, true);
  Game.drill.animations.add('upgradedx3', [9, 10, 11], 10, true);
  Game.drill.animations.add('teleporting', [12, 13, 14], 10, true);
  
  Game.drill.animations.play('normal');

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

  if(Game.missionTextOpen){
    Game.hud.interfaceText.setText('');
    Game.entities.hud.close();
    Game.missionTextOpen = false;
  }

  if(direction === 'up' && Game.spacecoOffered){
    return Game.entities.spaceco.open();
  }

  var surrounds = Game.entities.player.getSurrounds();

  if(direction === 'left' && (Game.drill.x <= Game.config.blockSize/2 || (!surrounds.bottomLeft && !surrounds.bottom))){
    return;
  }
  else if(direction === 'right' && (Game.drill.x >= (Game.config.maxBlockWidth * 64) - 32 || (!surrounds.bottomRight && !surrounds.bottom))){
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
  
  var newPosition = {
    x: Game.drill.x + (direction === 'left' ? -Game.config.blockSize : direction === 'right' ? Game.config.blockSize : 0),
    y: Game.drill.y + (direction === 'up' ? -Game.config.blockSize : direction === 'down' ? Game.config.blockSize : 0)
  }, newCameraPosition;
  var targetGroundType = Game.groundAt(newPosition.x, newPosition.y);
  var moveTime = targetGroundType ? Game.config.digTime[Game.config.mode][targetGroundType.replace('ground_', '')] ? Game.config.digTime[Game.config.mode][targetGroundType.replace('ground_', '')] : Game.config.drillMoveTime[Game.config.mode] : Game.config.drillMoveTime[Game.config.mode];

  if(direction === 'teleport'){
    Game.cleanupView(1);

    Game.drill.animations.play('teleporting');

    moveTime = Math.ceil(Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y));

    setTimeout(function(){
      Game.drawCurrentView();
      Game.drill.animations.play('normal');
      Game.entities.spaceco.offer();
    }, 200 + moveTime);

    newCameraPosition = { x: Game.spaceco.x - Game.config.width / 2, y: 0 };    

    newPosition.x = Game.spaceco.x;
    newPosition.y = Game.spaceco.y;
  }
  else if(direction === 'up'){
    newCameraPosition = { x: game.camera.x, y: game.camera.y - Game.config.blockSize };
  }
  else if(direction === 'down'){
    newCameraPosition = { x: game.camera.x, y: game.camera.y + Game.config.blockSize };
  }
  else if(direction === 'left' && Math.abs((game.camera.x + Game.config.width) - Game.drill.x) > Game.config.width / 2){
    newCameraPosition = { x: Math.max(0, game.camera.x - Game.config.blockSize), y: game.camera.y };
  }
  else if(direction === 'right' && Math.abs(game.camera.x - Game.drill.x) > Game.config.width / 2){
    newCameraPosition = { x: Math.min((Game.config.maxBlockWidth * 64) - (Game.config.width), game.camera.x + Game.config.blockSize), y: game.camera.y };
  }

  if(newCameraPosition) Game.adjustViewPosition(newCameraPosition.x, newCameraPosition.y, moveTime);

  if(targetGroundType){
    console.log('Drill: Im diggin here! ', targetGroundType, newPosition);

    if(targetGroundType.startsWith('mineral') && Game.hull.space > 0){
      Game.minerals.forEachAlive(function(mineral){
        if(mineral.x === newPosition.x && mineral.y === newPosition.y){
          Game.hull[mineral.type] = Game.hull[mineral.type] !== undefined ? Game.hull[mineral.type] : 0;
          
          Game.hull[mineral.type]++;

          var animationTime = 200 + Math.ceil(Game.game.math.distance(game.camera.x, game.camera.y, mineral.x, mineral.y));

          game.add.tween(mineral).to({ x: game.camera.x, y: game.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);
  
          setTimeout(function(){
            Game.hull.space -= 0.5;
  
            mineral.kill();
      
            Game.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)] = -1;
            Game.viewBufferMap[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)] = -1;
          }, animationTime);
        }
      });
    }

    else if(targetGroundType.startsWith('ground')){
      Game.drill.emitter = Game.game.add.emitter(0, 0, 100);
      Game.drill.addChild(Game.drill.emitter);
  
      var frameMod = Game.entities.ground.types.indexOf(targetGroundType.replace('ground_', '')) * 4;
    
      Game.drill.emitter.makeParticles('ground', [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod]);
    
      // Game.drill.emitter.x = Game.drill.x;
      // Game.drill.emitter.y = Game.drill.y;

      Game.drill.emitter.setScale(0.2, 0.4, 0.2, 0.4);
    
      Game.drill.emitter.start(true, 1000, null, 4);

      Game.entities.ground.dig(newPosition);
    }
  }
  
  if(Game.hull.space < 0) moveTime += 250;

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

  Game.entities.player.lastMoveInvert = invertTexture;
  Game.entities.player.lastMove = direction;

  Game.entities.player.lastPosition = newPosition;
  
  Game.map[Game.toGridPos(Game.drill.x)][Game.toGridPos(Game.drill.y)] = -1;
  Game.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)] = Game.mapNames.indexOf('player1');
  Game.viewBufferMap[Game.toGridPos(Game.drill.x)][Game.toGridPos(Game.drill.y)] = -1;
  Game.viewBufferMap[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)] = Game.mapNames.indexOf('player1');
  
  Game.depth = (newPosition.y - Game.config.blockMiddle) / Game.config.blockSize;

  if(!Game.spacecoOffered && Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y) < Game.config.blockSize + 10){
    Game.entities.spaceco.offer();
  }
  else if(Game.spacecoOffered && Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y) > Game.config.blockSize - 10){
    Game.entities.spaceco.revoke();
  }

  if(Game.config.mode === 'normal'){
    Game.fuel -= 0.1;
  }

  setTimeout(function(){
    Game.entities.hud.update();
    
    // if(Game.drill.emitter){
    //   Game.drill.emitter.destroy();
    //   Game.drill.emitter = null;
    // }
  }, moveTime + 150);
};
