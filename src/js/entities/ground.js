/* global Phaser, Game */

Game.entities.ground = function(){};

Game.entities.ground.prototype.update = function(){};

Game.entities.ground.create = function(game, x, y){
  var groundType = Game.weightedChance(Game.config.groundDistribution[Game.config.mode]);

  var ground = Game.ground.getFirstDead();

  if(ground === null){
    ground = game.add.sprite(x, y, groundType, 4, Game.ground);
    ground.anchor.setTo(0.5, 0.5);
    
    var animation = ground.animations.add('crush', [0, 1, 2, 3], 15, false);
    animation.killOnComplete = true;
  }
  else{
    ground.reset(x, y);
    ground.frame = 0;
    ground.alpha = 1;
    ground.revive();
  }

  Game.groundMap[x] = Game.groundMap[x] || [];
  Game.groundMap[x][y] = groundType;

  return ground;
};

Game.entities.ground.crush = function(pos){
  // var position = {};//Game.normalizePosition(x, y);
  // x = position.x;
  // y = position.y;

  var groundType = Game.groundAt(pos.x, pos.y);
  console.log('crush: ', groundType, pos);

  for(var i = 0; i < Game.ground.children.length; i++){
    var ground = Game.ground.children[i];
    
    if(ground.x === pos.x && ground.y === pos.y && !ground.animations.getAnimation('crush').isPlaying){
      ground.tween = Game.game.add.tween(ground).to({ alpha: 0 }, Game.config.digTime[Game.config.mode][groundType], Phaser.Easing.Cubic.In, true);
      ground.animations.play('crush');
    }
  }
  
  // Game.groundMap[x] = Game.groundMap[x] || [];
  Game.groundMap[pos.x][pos.y] = 0;
};

Game.entities.ground.dig = function(pos){
  // var position = {};//Game.normalizePosition(x, y);
  // x = position.x;
  // y = position.y;
  
  var groundType = Game.groundAt(pos.x, pos.y);
  console.log('dig: ', groundType, pos);

  Game.entities.ground.crush(pos);

  if(groundType === 'ground_blue'){
    // ARMOUR

    Game.blueScore++;
  }
  else if(groundType === 'ground_red'){
    // LAVA SPAWN

    if(Game.chance()) Game.entities.lava.create(Game.game, pos.x, pos.y);
  }
  else if(groundType === 'ground_green'){
    // FUEL

    Game.greenScore++;
  }
  else if(groundType === 'ground_purple'){ //these should have the chance to be opposite effect
    // SUPER SAVE

    var good = Game.chance(80);

    Game.lava.forEachAlive(function(lava){
      if(good && Game.chance(85)) lava.kill();
    }, this);

    Game.monsters.forEachAlive(function(monster){
      if(good && Game.chance(85)) monster.kill();
    }, this);

    if(!good){
      for(var x = Game.config.blockSize / 2; x < Game.game.width; x += Game.config.blockSize){
        for(var y = Game.groundDepth - Game.config.height; y < Game.groundDepth; y += Game.config.blockSize){
          if(Game.chance(90) && Game.groundAt(x, y) === 'ground_red'){
            Game.entities.ground.crush({ x: x, y: y });
            Game.entities.lava.create(Game.game, x, y);
          }
        }
      }
    }
  }
  else if(groundType === 'ground_teal'){
    // SAVE

    Game.lava.forEachAlive(function(lava){
      if(Game.chance(85)) lava.kill();
    }, this);

    Game.monsters.forEachAlive(function(monster){
      if(Game.chance(85)) monster.kill();
    }, this);
  }
};