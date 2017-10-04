/* global Phaser, Game */

Game.entities.ground = function(game, x, y, type){
  Phaser.Sprite.call(this, game, x, y, 'ground');

  this.anchor.setTo(0.5, 0.5);

  if(!type){
    type = Game.weightedChance(Game.modes[Game.mode].levels[Game.modes[Game.mode].level]);
    Game.map[Game.toGridPos(x)][Game.toGridPos(y)] = Game.mapNames.indexOf(type);
    Game.viewBufferMap[Game.toGridPos(x)][Game.toGridPos(y)] = Game.mapNames.indexOf(type);
  }

  type = type.replace('ground_', '');

  this.ground_type = type;
  this.ground_type_ID = Game.entities.ground.types.indexOf(type);

  var frameMod = this.ground_type_ID * 4;

  this.frame = 0 + frameMod;
  
  var animation = this.animations.add('crush_'+ type, [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod], 10, false);
  animation.killOnComplete = true;
};

Game.entities.ground.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.ground.prototype.constructor = Game.entities.ground;

Game.entities.ground.types = ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'];

Game.entities.ground.create = function(game, x, y, type){
  return Game.ground.add(new Game.entities.ground(game, x, y, type));
};


Game.entities.ground.crush = function(pos){
  var groundType = Game.groundAt(pos.x, pos.y).replace('ground_', '');
  // console.log('crush: ', groundType, pos);

  Game.ground.forEachAlive(function(ground){
    if(ground.x === pos.x && ground.y === pos.y && !ground.animations.getAnimation('crush_'+ ground.ground_type).isPlaying){
      ground.tween = Game.game.add.tween(ground).to({ alpha: 0 }, Game.modes[Game.mode].digTime[groundType], Phaser.Easing.Cubic.In, true);
      ground.animations.play('crush_'+ ground.ground_type);

      Game.map[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)] = -1;
      Game.viewBufferMap[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)] = -1;
    }
  });
};

Game.entities.ground.dig = function(pos){
  var type = Game.groundAt(pos.x, pos.y);

  // console.log('dig: ', type, pos);
  if(!type) return;
  
  Game.entities.ground.crush(pos);

  type = type.replace('ground_', '');
  
  var blockBehavior = Game.modes[Game.mode].blockBehavior[type];
  if(blockBehavior && Game.entities.ground.behaviors[blockBehavior.split(':~:')[0]]){
    Game.entities.ground.applyBehavior(blockBehavior.split(':~:')[0], blockBehavior.split(':~:')[1], pos);
  }
  
  if(type === 'red' || Game.hull.space < 0) return;  

  Game.hull.space -= 0.13;

  Game.hull['ground_'+ type] = Game.hull['ground_'+ type] !== undefined ? Game.hull['ground_'+ type] : 0;

  Game.hull['ground_'+ type]++;
};


Game.entities.ground.behaviors = {
  lava: function(chance, pos){
    if(Game.chance(chance)){
      Game.entities.lava.create(Game.game, pos.x, pos.y);
      Game.viewBufferMap[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)] = Game.mapNames.indexOf('lava');
    }
  },
  lavaRelease: function(){
    for(var x = Game.blockPx / 2; x < Game.game.width; x += Game.blockPx){
      for(var y = Game.groundDepth - Game.viewHeight; y < Game.groundDepth; y += Game.blockPx){
        if(Game.chance(90) && Game.groundAt(x, y) === 'ground_red'){
          Game.entities.ground.crush({ x: x, y: y });
          Game.entities.lava.create(Game.game, x, y);
          Game.viewBufferMap[Game.toGridPos(x)][Game.toGridPos(y)] = Game.mapNames.indexOf('lava');
        }
      }
    }
  },
  lavaSolidify: function(radius){
    Game.lava.forEachAlive(function(lava){
      if(Game.game.math.distance(Game.drill.x, Game.drill.y, lava.x, lava.y) < Game.blockPx * (radius || 4)){
        Game.entities.ground.create(Game.game, lava.x, lava.y);
        lava.kill();
      }
    }, this);
  },
  save: function(chance, offChanceFunc){
    if(Game.chance(chance)){
      Game.lava.forEachAlive(function(lava){
        if(Game.chance(85)) lava.kill();
        Game.viewBufferMap[Game.toGridPos(lava.x)][Game.toGridPos(lava.y)] = -1;
      }, this);
  
      Game.monsters.forEachAlive(function(monster){
        if(Game.chance(85)) monster.kill();
        Game.viewBufferMap[Game.toGridPos(monster.x)][Game.toGridPos(monster.y)] = -1;
      }, this);
    }

    else if(offChanceFunc) Game.entities.ground.applyBehavior(offChanceFunc);
  }
};

Game.entities.ground.applyBehavior = function(name, options, pos){
  if(options) options = options.split(',');

  if(name === 'lava'){
    if(!options) options = [null, pos];
    else options.push(pos);
  }

  if(Game.entities.ground.behaviors[name]) Game.entities.ground.behaviors[name].apply(null, options);
};