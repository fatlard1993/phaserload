/* global Phaser, Game */

Game.entities.ground = function(x, y){
  Phaser.Sprite.call(this, Game.game, x, y, 'ground');

  this.anchor.setTo(0.5, 0.5);
};

Game.entities.ground.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.ground.prototype.constructor = Game.entities.ground;

Game.entities.ground.types = ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'];

Game.entities.ground.create = function(x, y, type){
  var ground = null;//Game.ground.getFirstDead();//causes issues
  
  if(ground === null){
    ground = Game.ground.add(new Game.entities.ground(x, y));
  }
  else{
    ground.reset(x, y);
    ground.revive();
  }

  if(!type){
    type = Game.weightedChance(Game.modes[Game.mode].levels[Game.modes[Game.mode].level].layers[Math.ceil(Game.modes[Game.mode].levels[Game.modes[Game.mode].level].layers.length * (Game.toGridPos(y) / Game.depth)) - 1]);
    Game.map[Game.toGridPos(x)][Game.toGridPos(y)][0] = Game.mapNames.indexOf('ground_'+ type);
    Game.viewBufferMap[Game.toGridPos(x)][Game.toGridPos(y)][0] = Game.mapNames.indexOf('ground_'+ type);
  }

  type = type.replace('ground_', '');
  
  ground.ground_type = type;
  ground.ground_type_ID = Game.entities.ground.types.indexOf(type);

  var frameMod = ground.ground_type_ID * 4;

  ground.frame = 0 + frameMod;
  
  var animation = ground.animations.add('crush_'+ type, [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod], 10, false);
  animation.killOnComplete = true;

  return ground;
};

Game.entities.ground.crush = function(pos){
  var groundType = Game.groundAt(pos.x, pos.y).replace('ground_', '');
  // console.log('crush: ', groundType, pos);

  Game.ground.forEachAlive(function(ground){
    if(ground.x === pos.x && ground.y === pos.y && !ground.animations.getAnimation('crush_'+ ground.ground_type).isPlaying){
      ground.tween = Game.game.add.tween(ground).to({ alpha: 0 }, Game.modes[Game.mode].digTime[groundType], Phaser.Easing.Cubic.In, true);
      ground.animations.play('crush_'+ ground.ground_type);

      Game.map[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)][0] = -1;
      Game.viewBufferMap[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)][0] = -1;

      var gridPos = {
        x: Game.toGridPos(ground.x),
        y: Game.toGridPos(ground.y)
      };

      var surrounds = {
        left: Game.mapPosName(gridPos.x - 1, gridPos.y),
        top: Game.mapPosName(gridPos.x, gridPos.y - 1),
        right: Game.mapPosName(gridPos.x + 1, gridPos.y),
        bottom: Game.mapPosName(gridPos.x, gridPos.y + 1)
      };

      Game.entities.ground.releaseSurrounds(ground, surrounds, Game.modes[Game.mode].digTime[groundType]);
    }
  });
};

Game.entities.ground.releaseSurrounds = function(ground, surrounds, delay){
  setTimeout(function(){
    if(['gas', 'lava'].includes(surrounds.left)){
      Game.entities.lava.spread(ground.x - Game.blockPx, ground.y);
      Game.entities.gas.spread(ground.x - Game.blockPx, ground.y);
    }
  
    if(['lava'].includes(surrounds.top)){
      Game.entities.lava.spread(ground.x, ground.y - Game.blockPx);
    }
  
    if(['gas', 'lava'].includes(surrounds.right)){
      Game.entities.lava.spread(ground.x + Game.blockPx, ground.y);
      Game.entities.gas.spread(ground.x + Game.blockPx, ground.y);
    }
  
    if(['gas'].includes(surrounds.bottom)){
      Game.entities.gas.spread(ground.x, ground.y + Game.blockPx);
    }
  }, delay + 1000);
};

Game.entities.ground.dig = function(pos){
  var type = Game.groundAt(pos.x, pos.y);

  // console.log('dig: ', type, pos);
  if(!type) return;
  
  Game.entities.ground.crush(pos);

  type = type.replace('ground_', '');
  
  var blockAction = Game.modes[Game.mode].blockBehavior[type];
  if(blockAction && Game.effects[blockAction.split(':~:')[0]]){
    Game.entities.ground.applyBehavior(blockAction.split(':~:')[0], blockAction.split(':~:')[1], pos);
  }

  var groundWeight = 0.07 + (Game.modes[Game.mode].digTime[type] * 0.0001);
  
  if(type === 'red' || Game.hull.space < groundWeight) return;  

  Game.hull.space -= groundWeight;

  Game.hull['ground_'+ type] = Game.hull['ground_'+ type] !== undefined ? Game.hull['ground_'+ type] : 0;

  Game.hull['ground_'+ type]++;
};

Game.entities.ground.applyBehavior = function(name, options, pos){
  if(options) options = options.split(',');

  if(name === 'lava' || name === 'gas'){
    if(!options) options = [null, pos];
    else options.push(pos);
  }

  if(Game.effects[name]) Game.effects[name].apply(null, options);
};