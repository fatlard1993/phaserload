/* global Phaser, Game */

Game.entities.player = function(){};

Game.entities.player.create = function(){
  var playerX = Game.rand(1, Game.width - 1);

  var player = Game.game.add.sprite(Game.toPx(playerX), Game.toPx(1), 'drill', 15);

  player.anchor.setTo(0.5, 0.5);

  player.animations.add('normal', [0, 1, 2], 10, true);
  player.animations.add('upgrade_1', [3, 4, 5], 10, true);
  player.animations.add('upgrade_2', [6, 7, 8], 10, true);
  player.animations.add('upgrade_3', [9, 10, 11], 10, true);
  player.animations.add('teleporting', [12, 13, 14], 10, true);

  player.animations.play('normal');

  Game.map[playerX][1][0] = Game.mapNames.indexOf('player1');

  Game.drillScaleX = player.scale.x;

  Game.adjustViewPosition(player.x - Game.viewWidth / 2, player.y - Game.viewHeight / 2, Math.ceil(Game.game.math.distance(player.x, player.y, Game.game.camera.x / 2, Game.game.camera.y / 2)));

  return player;
};

Game.entities.player.getSurrounds = function(){
  return {
    left: Game.groundAt(Game.drill.x - Game.blockPx, Game.drill.y),
    farLeft: Game.groundAt(Game.drill.x - (Game.blockPx * 2), Game.drill.y),
    topLeft: Game.groundAt(Game.drill.x - Game.blockPx, Game.drill.y - Game.blockPx),
    top: Game.groundAt(Game.drill.x, Game.drill.y - Game.blockPx),
    topRight: Game.groundAt(Game.drill.x + Game.blockPx, Game.drill.y - Game.blockPx),
    right: Game.groundAt(Game.drill.x + Game.blockPx, Game.drill.y),
    farRight: Game.groundAt(Game.drill.x + (Game.blockPx * 2), Game.drill.y),
    bottomRight: Game.groundAt(Game.drill.x + Game.blockPx, Game.drill.y + Game.blockPx),
    bottom: Game.groundAt(Game.drill.x, Game.drill.y + Game.blockPx),
    bottomLeft: Game.groundAt(Game.drill.x - Game.blockPx, Game.drill.y + Game.blockPx)
  };
};

Game.entities.player.move = function(game, direction){
  // console.log('Drill: On the move, goin: ', direction);

  var surrounds = Game.entities.player.getSurrounds();

  if(direction === 'left' && (Game.drill.x <= Game.blockPx/2 || (!surrounds.bottomLeft && !surrounds.bottom && !surrounds.farLeft))){
    return;
  }
  else if(direction === 'right' && (Game.drill.x >= (Game.width * 64) - 32 || (!surrounds.bottomRight && !surrounds.bottom && !surrounds.farRight))){
    return;
  }
  else if(direction === 'down' && Game.drill.y === Game.toPx(Game.depth - 2)){
    return;
  }
  else if(direction === 'up' && (!surrounds.left && !surrounds.right && !surrounds.topLeft && !surrounds.topRight)){
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
    x: Game.drill.x + (direction === 'left' ? -Game.blockPx : direction === 'right' ? Game.blockPx : 0),
    y: Game.drill.y + (direction === 'up' ? -Game.blockPx : direction === 'down' ? Game.blockPx : 0)
  }, newCameraPosition;

  var targetGroundType = Game.groundAt(newPosition.x, newPosition.y);
  var moveTime = targetGroundType ? Game.modes[Game.mode].digTime[targetGroundType.replace('ground_', '')] ? Game.modes[Game.mode].digTime[targetGroundType.replace('ground_', '')] : Game.modes[Game.mode].baseDrillMoveTime : Game.modes[Game.mode].baseDrillMoveTime;

  if(direction.includes('teleport')){
    Game.drill.animations.play('teleporting');

    var teleportPos = direction.includes('responder') ? { x: Game.drill.responder.x, y: Game.drill.responder.y } : { x: Game.spaceco.x, y: Game.spaceco.y };

    moveTime = Math.ceil(Game.game.math.distance(Game.drill.x, Game.drill.y, teleportPos.x, teleportPos.y));

    setTimeout(function(){
      // Game.drawCurrentView();
      Game.drill.animations.play(Game.drill.upgrade > 0 ? 'upgrade_'+ Game.drill.upgrade : 'normal');
      if(!direction.includes('responder')) Game.notify('Open your console to connect to Spaceco', 2);
    }, 200 + moveTime);

    newCameraPosition = { x: teleportPos.x - Game.viewWidth / 2, y: teleportPos.y - Game.viewHeight / 2 };

    newPosition.x = teleportPos.x;
    newPosition.y = teleportPos.y;
  }
  else if(direction === 'up' && Math.abs((game.camera.y + Game.viewHeight) - Game.drill.y) > Game.viewHeight / 2){
    newCameraPosition = { x: game.camera.x, y: game.camera.y - Game.blockPx };
  }
  else if(direction === 'down' && Math.abs(game.camera.y - Game.drill.y) > Game.viewHeight / 2){
    newCameraPosition = { x: game.camera.x, y: game.camera.y + Game.blockPx };
  }
  else if(direction === 'left' && Math.abs((game.camera.x + Game.viewWidth) - Game.drill.x) > Game.viewWidth / 2){
    newCameraPosition = { x: game.camera.x - Game.blockPx, y: game.camera.y };
  }
  else if(direction === 'right' && Math.abs(game.camera.x - Game.drill.x) > Game.viewWidth / 2){
    newCameraPosition = { x: game.camera.x + Game.blockPx, y: game.camera.y };
  }

  if(targetGroundType && targetGroundType.startsWith('ground')){
    Game.drill.emitter = Game.game.add.emitter(0, 0, 100);
    Game.drill.addChild(Game.drill.emitter);

    var frameMod = Game.entities.ground.types.indexOf(targetGroundType.replace('ground_', '')) * 4;

    Game.drill.emitter.makeParticles('ground', [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod]);

    Game.drill.emitter.x = 32;

    Game.drill.emitter.setScale(0.1, 0.3, 0.1, 0.3);

    Game.drill.emitter.start(true, moveTime + 100, null, Math.round(Game.rand(3, 7)));

    Game.entities.ground.dig(newPosition);
  }

  var mineralWeight = 0.08;

  if(Game.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][1] && Game.hull.space > mineralWeight){
    Game.minerals.forEachAlive(function(mineral){
      if(mineral.x === newPosition.x && mineral.y === newPosition.y){
        Game.hull[mineral.type] = Game.hull[mineral.type] !== undefined ? Game.hull[mineral.type] : 0;

        Game.hull[mineral.type]++;

        var animationTime = 200 + Math.ceil(Game.game.math.distance(game.camera.x, game.camera.y, mineral.x, mineral.y));

        game.add.tween(mineral).to({ x: game.camera.x, y: game.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);

        setTimeout(function(){
          Game.hull.space -= mineralWeight;

          mineral.kill();

          Game.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][1] = -1;
          Game.viewBufferMap[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][1] = -1;
        }, animationTime);
      }
    });
  }

  if(Game.hull.space < 0) moveTime += 250;

  moveTime = Math.max(Game.modes[Game.mode].baseDrillMoveTime, moveTime - (((Game.drill.upgrade || 0) + 1) * 50));

  //if(targetGroundType && targetGroundType.startsWith('ground')) Game.game.camera.shake((moveTime * 0.00001) * 0.42, moveTime);

  game.add.tween(Game.drill).to(newPosition, moveTime, Phaser.Easing.Sinusoidal.InOut, true);

  if(newCameraPosition) Game.adjustViewPosition(newCameraPosition.x, newCameraPosition.y, moveTime, direction);

  var invertTexture = false;

  if(direction === 'up'){
    if(surrounds.left || surrounds.topLeft && !(surrounds.topRight && surrounds.topLeft && Game.entities.player.lastMove === 'right')){
      invertTexture = true;
      Game.drill.angle = 90;
    }
    else Game.drill.angle = -90;
  }
  else if(direction === 'down'){
    if(surrounds.right || surrounds.bottomRight && !(surrounds.bottomRight && surrounds.bottomLeft && Game.entities.player.lastMove === 'right')){
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

  if(invertTexture) Game.drill.scale.x = -Game.drillScaleX;
  else Game.drill.scale.x = Game.drillScaleX;

  Game.entities.player.lastMoveInvert = invertTexture;
  Game.entities.player.lastMove = direction;

  Game.entities.player.lastPosition = newPosition;

  Game.map[Game.toGridPos(Game.drill.x)][Game.toGridPos(Game.drill.y)][0] = -1;
  Game.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][0] = Game.mapNames.indexOf('player1');
  Game.viewBufferMap[Game.toGridPos(Game.drill.x)][Game.toGridPos(Game.drill.y)][0] = -1;
  Game.viewBufferMap[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][0] = Game.mapNames.indexOf('player1');

  if(Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y) < Game.blockPx + 10){
    Game.notify('Open your console to connect to Spaceco', 2);
  }
  else if(Game.game.math.distance(Game.drill.x, Game.drill.y, Game.spaceco.x, Game.spaceco.y) > Game.blockPx - 10){
    Game.infoLine.setText('');
  }
  else if(Game.hud.isOpen) Game.entities.hud.close();

  if(!direction.includes('teleport') && Game.mode === 'normal'){
    Game.fuel -= moveTime * 0.0001;

    if(Game.fuel < 1.5) Game.notify('Your fuel is running low', 2);
  }

  if(Game.hull.space < 1.5){
    if(!Game.hullWarning_TO){
      Game.hullWarning_TO = setTimeout(function(){
        Game.notify('Your Hull is almost full', 2);
      }, 2000);
    }
  }

  setTimeout(function(){
    Game.entities.hud.update();

    if(Game.drill.emitter){
      Game.drill.emitter.destroy();
      Game.drill.emitter = null;
    }
  }, moveTime + 150);
};

Game.entities.player.useItem = function(slotNum, item){
  if(Game.entities.player.justUsedItem || !Game['itemSlot'+ slotNum].item || Game['itemSlot'+ slotNum].item === '') return;

  if(Game.entities.player.justUsedItem_TO){
    clearTimeout(Game.entities.player.justUsedItem_TO);
    Game.entities.player.justUsedItem_TO = null;
  }
  if(!Game.entities.player.justUsedItem_TO){
    Game.entities.player.justUsedItem = true;
    Game.entities.player.justUsedItem_TO = setTimeout(function(){
      Game.entities.player.justUsedItem = false;
    }, 500);
  }

  if(item === 'teleporter'){
    Game.entities.player.move(Game.game, 'teleport');
  }
  else if(item.includes('charge')){
    if(Game.drill.activeCharge){
      Game.notify('You have already placed a charge', 2);

      return;
    }

    var frame = 0;

    if(item.includes('freeze')) frame += 4;

    if(item.includes('remote')){
      frame += 2;

      Game.entities.itemSlot.setItem(slotNum, '');
      Game.entities.itemSlot.setItem(slotNum, 'detonator');
    }
    else{
      Game.drill.charge_TO = setTimeout(function(){
        Game.drill.activeCharge.frame++;

        Game.effects[Game.drill.activeChargeType.includes('freeze') ? 'freeze' : 'explode']({ x: Game.drill.activeCharge.x, y: Game.drill.activeCharge.y }, Game.drill.activeChargeType.includes('remote') ? 5 : 3);

        Game.game.camera.shake(Game.drill.activeChargeType.includes('remote') ? 0.05 : 0.03, 1000);

        setTimeout(function(){
          Game.drill.activeCharge.destroy();
          Game.drill.activeCharge = null;
          Game.drill.activeChargeType = null;
        }, 1000);
      }, 3*1000);
    }

    Game.drill.activeChargeType = item;

    Game.drill.activeCharge = Game.game.add.sprite(Game.drill.x, Game.drill.y, 'explosive');
    Game.drill.activeCharge.anchor.setTo(0.5, 0);
    Game.drill.activeCharge.frame = frame;
  }
  else if(item === 'detonator'){
    Game['itemSlot'+ slotNum].itemSprite.animations.play('use');

    Game.drill.charge_TO = setTimeout(function(){
      Game.drill.activeCharge.frame++;

      Game.effects[Game.drill.activeChargeType.includes('freeze') ? 'freeze' : 'explode']({ x: Game.drill.activeCharge.x, y: Game.drill.activeCharge.y }, Game.drill.activeChargeType.includes('remote') ? 5 : 3);

      Game.game.camera.shake(Game.drill.activeChargeType.includes('remote') ? 0.05 : 0.03, 1000);

      setTimeout(function(){
        Game.entities.itemSlot.setItem(slotNum, '');
        if(Game.inventory[Game.drill.activeChargeType] > 0) Game.entities.itemSlot.setItem(slotNum, Game.drill.activeChargeType);

        Game.drill.activeCharge.destroy();
        Game.drill.activeCharge = null;
        Game.drill.activeChargeType = null;
      }, 1000);
    }, 1000);
  }
  else if(item === 'responder_teleporter'){
    if(!Game.drill.responder){
      Game.drill.responder = Game.game.add.sprite(Game.drill.x, Game.drill.y, 'responder');
      Game.drill.responder.anchor.setTo(0.5, 0);
      Game.drill.responder.animations.add('active', [0, 1], 5, true);
      Game.drill.responder.animations.play('active');

      Game.entities.player.move(Game.game, 'teleport');
    }
    else{
      Game.entities.player.move(Game.game, 'responder_teleport');

      Game.drill.responder.destroy();
      Game.drill.responder = null;
    }
  }
  else{
    console.log(item, ' not yet implemented use func');
  }

  if(item !== 'detonator'){
    if(item === 'responder_teleporter' && Game.drill.responder) return;

    Game.inventory[item]--;

    if(!Game.inventory[item]){
      delete Game.inventory[item];
      if(!item.includes('remote')) Game.entities.itemSlot.setItem(slotNum, '');
    }
  }
};

Game.entities.player.hurt = function(amount, by){
  if(Game.drill.justHurt) return; //todo make this depend on what the damage is from
  Game.drill.justHurt = true;
  Game.drill.justHurt_TO = setTimeout(function(){ Game.drill.justHurt = false; }, 500);

  Game.health -= amount;

  if(Game.health <= 0){
    Game.drill.kill();
    Game.loseReason = by;
    Game.game.time.events.add(200, function(){ Game.game.state.start('end'); });
  }
  else if(Game.health <= 25){
    Game.notify('Your health is running low', 2);
  }

  Game.entities.hud.update();
};