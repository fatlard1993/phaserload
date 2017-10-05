/* global Phaser, Game */

Game.states.play = function(game){};

Game.states.play.prototype.create = function(){
  console.log('play');

  Game.modes[Game.mode].nextLevel();
  Game.generateMap();
  
  Game.game.camera.bounds = null;

  Game.ground = this.game.add.group();
  Game.lava = this.game.add.group();
  Game.minerals = this.game.add.group();
  
  Game.spaceco = Game.entities.spaceco.create();

  Game.monsters = this.game.add.group();
  
  Game.drill = Game.entities.player.create();

  Game.infoLine = this.game.add.text(5, 110, '', { font: '25px '+ Game.config.font, fill: '#fff', fontWeight: 'bold', backgroundColor: '#111' });
  Game.infoLine.fixedToCamera = true; 

  Game.teleporter = Game.game.add.sprite(150, 20, 'teleporter');
  Game.teleporter.anchor.setTo(0.5, 0.5);
  Game.teleporter.fixedToCamera = true;
  
  Game.hud = Game.entities.hud.create(0, 0);
  
  // this.game.input.keyboard.addKeyCapture([
  //   Phaser.Keyboard.LEFT,
  //   Phaser.Keyboard.RIGHT,
  //   Phaser.Keyboard.UP,
  //   Phaser.Keyboard.DOWN,
  //   Phaser.Keyboard.ONE,
  //   Phaser.Keyboard.TWO
  // ]);
  
  // var upperQuarter = new Phaser.Rectangle(0, 0, this.game.width, this.game.height / 4);
  // var middleLeftQuarter = new Phaser.Rectangle(0, this.game.height / 4, this.game.width / 2, (this.game.height / 4) * 3);
  // var middleRightQuarter = new Phaser.Rectangle(this.game.width / 2, this.game.height / 4, this.game.width, (this.game.height / 4) * 3);
  // var lowerQuarter = new Phaser.Rectangle(0, (this.game.height / 4) * 3, this.game.width, this.game.height);

  var handleTouchRegions = function(pointer){
    if(Game.inSpaceco){
      console.log(pointer, pointer.x, pointer.y);

      if(pointer.y > 65 && pointer.y < 92){
        //menu
        if(pointer.x > 42 && pointer.x < 134) Game.entities.spaceco.setView('rates');
        else if(pointer.x > 142 && pointer.x < 250) Game.entities.spaceco.setView('fuel');
        else if(pointer.x > 255 && pointer.x < 335) Game.entities.spaceco.setView('shop');
        else if(pointer.x > 345 && pointer.x < 420) Game.entities.spaceco.revoke();
      }

      // if(this.game.math.distance(pointer.x, pointer.y, monster.x, monster.y) < Game.blockPx/2)

      return;
    }

    if(Game.game.tweens.isTweening(Game.drill)) return;
    var moving;

    if(Game.game.math.distance(pointer.x, pointer.y, 150, 20) < 32){ // teleporter icon
      moving = 'teleport';
    }
    // else if(upperQuarter.contains(pointer.x, pointer.y)){
    //   moving = 'up';
    // }
    // else if(lowerQuarter.contains(pointer.x, pointer.y)){
    //   moving = 'down';
    // }
    // else if(middleLeftQuarter.contains(pointer.x, pointer.y)){
    //   moving = 'left';
    // }
    // else if(middleRightQuarter.contains(pointer.x, pointer.y)){
    //   moving = 'right';
    // }
    else{
      var xDiff = Game.drill.x - pointer.x - Game.game.camera.x;
      var yDiff = Game.drill.y - pointer.y - Game.game.camera.y;

      var xDirection = xDiff > 0 ? 'left' : 'right';
      var yDirection = yDiff > 0 ? 'up' : 'down';

      moving = Math.abs(xDiff) > Math.abs(yDiff) ? xDirection : yDirection;
      
      // console.log(xDiff, yDiff, xDirection, yDirection, moving);
    }
    
    if(moving){
      console.log(moving);
      Game.entities.player.move(Game.game, moving);
    }
  };

  this.game.input.onDown.add(handleTouchRegions);

  Game.showMissionText();

  Game.hull = {};
  Game.hull.space = 10;

  Game.credits = 0;
  Game.fuel = Game.mode === 'normal' ? 5 : 0;
  
  Game.hull.mineral_green = 0;
  Game.hull.mineral_red = 0;
  Game.hull.mineral_blue = 0;

  Game.entities.hud.update();
};

Game.states.play.prototype.update = function(){
  if(Game.mode === 'normal' && Game.fuel < 0){
    Game.loseReason = 'fuel';
    return this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
  }

  if(Game.drill.emitter){
    Game.drill.emitter.forEachAlive(function(particle){
      particle.alpha = Math.max(0, Math.min(1, (particle.lifespan / Game.drill.emitter.lifespan) * 2));
    });
  }

  var moving;

  if(!this.game.tweens.isTweening(Game.drill)){
    var surrounds = Game.entities.player.getSurrounds();

    if(this.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
      moving = 'left';
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
      moving = 'right';
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.DOWN)){
      moving = 'down';
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.UP)){
      moving = 'up';
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.X)){
      moving = 'teleport';
    }

    if(moving){
      Game.entities.player.move(this.game, moving);
    }

    else if(!Game.entities.player.justMoved){
      if(!surrounds.left && !surrounds.right && !surrounds.bottom){
        var direction;
        
        if(Game.entities.player.lastMove === 'up' && (surrounds.bottomLeft || surrounds.bottomRight)){
          direction = surrounds.bottomLeft && !surrounds.bottomRight ? 'left' : (surrounds.bottomLeft && surrounds.bottomRight ? (Game.entities.player.lastMoveInvert ? 'left' : 'right') : 'right');
        }
        else direction = 'down';

        console.log('Automove from: '+ Game.entities.player.lastMove +' to: '+ direction, surrounds);

        Game.entities.player.move(this.game, direction);
      }
    }
  }

  Game.lava.forEachAlive(function(lava){
    if(!lava.lethal) return;

    if(!Game.drill.animations.getAnimation('teleporting').isPlaying && this.game.math.distance(Game.drill.x, Game.drill.y, lava.x, lava.y) < Game.blockPx/2){
      Game.drill.kill();
      Game.loseReason = 'lava';
      
      this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
    }

    if(this.game.math.distance(Game.spaceco.x, Game.spaceco.y, lava.x, lava.y) < Game.blockPx){
      Game.spaceco.kill();
    }

    Game.monsters.forEachAlive(function(monster){
      if(this.game.math.distance(monster.x, monster.y, lava.x, lava.y) < Game.blockPx){
        monster.kill();
      }
    }, this);
  }, this);

  Game.monsters.forEachAlive(function(monster){
    if(!Game.drill.animations.getAnimation('teleporting').isPlaying && this.game.math.distance(Game.drill.x, Game.drill.y, monster.x, monster.y) < Game.blockPx/2){
      Game.drill.kill();
      Game.loseReason = 'monster';
      
      this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
    }
  }, this);

  if(Game.spaceco.damage < 10 && !this.game.tweens.isTweening(Game.spaceco)){
    var gridPos = {
      x: Game.toGridPos(Game.spaceco.x),
      y: Game.toGridPos(Game.spaceco.y)
    };

    var spacecoGroundBase = {
      bottomRight: gridPos.x + 1 < Game.width ? Game.map[gridPos.x + 1][gridPos.y + 1] : -1,
      bottom: Game.map[gridPos.x][gridPos.y + 1],
      bottomLeft: gridPos.x - 1 >= 0 ? Game.map[gridPos.x - 1][gridPos.y + 1] : -1
    };

    if(spacecoGroundBase.bottomRight < 3 && spacecoGroundBase.bottom < 3 && spacecoGroundBase.bottomLeft < 3){
      Game.game.add.tween(Game.spaceco).to({ y: Game.spaceco.y + Game.blockPx }, 500, Phaser.Easing.Sinusoidal.InOut, true);

      Game.spaceco.damage++;

      if(Game.spaceco.damage === 10) setTimeout(Game.spaceco.kill, 400);
      else Game.spaceco.frame = Game.spaceco.damage;
    }  
  }
};