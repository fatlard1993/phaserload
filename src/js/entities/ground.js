/* global Phaser, Game */

Game.entities.ground = function(){};

// Game.entities.ground.prototype.update = function(){};

Game.entities.ground.create = function(game, x, y, groundType){
  if(!groundType){
    groundType = Game.weightedChance(Game.config.groundDistribution[Game.config.mode]);
    Game.map[Game.toGridPos(x)][Game.toGridPos(y)] = Game.mapNames.indexOf(groundType);
  }
  // console.log('creating: ', groundType, x, y);

  // cannot use this until we have a fix for resetting the texture (color)
  // best idea sofar is to add images to a larger image to create a spritesheet
  // = Game.ground.getFirstDead();
  var ground = null;

  if(ground === null){
    ground = game.add.sprite(x, y, groundType, 4, Game.ground);
    ground.anchor.setTo(0.5, 0.5);
    
    var animation = ground.animations.add('crush', [1, 2, 3, 4], 10, false);
    animation.killOnComplete = true;
  }
  else{
    ground.reset(x, y);
    ground.frame = 0;
    ground.alpha = 1;
    ground.revive();
  }

  return ground;
};

Game.entities.ground.crush = function(pos){
  var groundType = Game.groundAt(pos.x, pos.y);
  // console.log('crush: ', groundType, pos);

  Game.ground.forEachAlive(function(ground){
    if(ground.x === pos.x && ground.y === pos.y && !ground.animations.getAnimation('crush').isPlaying){
      ground.tween = Game.game.add.tween(ground).to({ alpha: 0 }, Game.config.digTime[Game.config.mode][groundType], Phaser.Easing.Cubic.In, true);
      ground.animations.play('crush');

      Game.map[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)] = 0;
    }
  });
};

Game.entities.ground.dig = function(pos){
  var groundType = Game.groundAt(pos.x, pos.y);
  // console.log('dig: ', groundType, pos);

  Game.entities.ground.crush(pos);

  if(Game.config.blockBehavior[Game.config.mode] && Game.config.blockBehavior[Game.config.mode][groundType] && Game.entities.ground.behaviors[Game.config.blockBehavior[Game.config.mode][groundType].split(':~:')[0]]){
    Game.entities.ground.applyBehavior(Game.config.blockBehavior[Game.config.mode][groundType].split(':~:')[0], Game.config.blockBehavior[Game.config.mode][groundType].split(':~:')[1], pos);
  }

  Game.hull.space -= 0.13;

  if(Game.hull.space < 0) return;

  if(groundType === 'ground'){
    Game.whiteScore++;
  }
  else if(groundType === 'ground_blue'){
    Game.blueScore++;
  }
  else if(groundType === 'ground_red'){
    Game.redScore++; 
  }
  else if(groundType === 'ground_green'){
    Game.greenScore++;
  }
  else if(groundType === 'ground_purple'){
    Game.purpleScore++;
  }
  else if(groundType === 'ground_teal'){
    Game.tealScore++;
  }
};


Game.entities.ground.behaviors = {
  lava: function(chance, pos){
    if(Game.chance(chance)) Game.entities.lava.create(Game.game, pos.x, pos.y);
  },
  lavaRelease: function(){
    for(var x = Game.config.blockSize / 2; x < Game.game.width; x += Game.config.blockSize){
      for(var y = Game.groundDepth - Game.config.height; y < Game.groundDepth; y += Game.config.blockSize){
        if(Game.chance(90) && Game.groundAt(x, y) === 'ground_red'){
          Game.entities.ground.crush({ x: x, y: y });
          Game.entities.lava.create(Game.game, x, y);
        }
      }
    }
  },
  lavaSolidify: function(radius){
    Game.lava.forEachAlive(function(lava){
      if(Game.game.math.distance(Game.drill.x, Game.drill.y, lava.x, lava.y) < Game.config.blockSize * (radius || 4)){
        Game.entities.ground.create(Game.game, lava.x, lava.y);
        lava.kill();
      }
    }, this);
  },
  save: function(chance, offChanceFunc){
    if(Game.chance(chance)){
      Game.lava.forEachAlive(function(lava){
        if(Game.chance(85)) lava.kill();
      }, this);
  
      Game.monsters.forEachAlive(function(monster){
        if(Game.chance(85)) monster.kill();
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
