/* global Phaser, Game */

Game.states.play = function(game){};

Game.states.play.prototype.create = function(){
  console.log('play');

  Game.modes[Game.mode].nextLevel();
  Game.generateMap();
  
  Game.game.camera.bounds = null;

  Game.ground = this.game.add.group();
  Game.lava = this.game.add.group();
  Game.gas = this.game.add.group();
  Game.minerals = this.game.add.group();
  
  Game.spaceco = Game.entities.spaceco.create();

  Game.monsters = this.game.add.group();
  
  Game.drill = Game.entities.player.create();

  Game.infoLine = this.game.add.text(5, 135, '', { font: '25px '+ Game.config.font, fill: '#fff', fontWeight: 'bold', backgroundColor: '#111' });
  Game.infoLine.fixedToCamera = true; 
  
  Game.hud = Game.entities.hud.create(0, 0);

  Game.itemSlot1 = Game.entities.itemSlot.create(Game.viewWidth - 32, 32);
  Game.itemSlot2 = Game.entities.itemSlot.create(Game.viewWidth - 32, 106);

  Game.showMissionText();

  if(Game.purchasedTransport){
    Game.purchasedTransport = false;
  }
  else{
    Game.entities.spaceco.resourceBay = {};

    Game.inventory = {};
    Game.inventory.teleporter = 1;

    Game.entities.itemSlot.setItem(1, 'teleporter');

    Game.hull = {};
    Game.hull.space = 10;
  
    Game.credits = 0;
    Game.fuel = 5;
  }

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

  if(this.input.keyboard.isDown(Phaser.Keyboard.ESC) && !Game.justPressedEsc){
    Game.justPressedEsc = true;
    Game.justPressedEsc_TO = setTimeout(function(){ Game.justPressedEsc = false; }, 1000);
    
    if(Game.hud.isOpen) Game.entities.hud.close();
    else Game.entities.hud.open('hud');
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

  if(Game.spaceco.damage <= 10 && !this.game.tweens.isTweening(Game.spaceco)){
    var gridPos = {
      x: Game.toGridPos(Game.spaceco.x),
      y: Game.toGridPos(Game.spaceco.y)
    };

    var spacecoGroundBase = {
      bottomRight: gridPos.x + 1 < Game.width ? Game.map[gridPos.x + 1][gridPos.y + 1][0] : -1,
      bottom: Game.map[gridPos.x][gridPos.y + 1][0],
      bottomLeft: gridPos.x - 1 >= 0 ? Game.map[gridPos.x - 1][gridPos.y + 1][0] : -1
    };

    if(spacecoGroundBase.bottomRight < 3 && spacecoGroundBase.bottom < 3 && spacecoGroundBase.bottomLeft < 3){
      Game.game.add.tween(Game.spaceco).to({ y: Game.spaceco.y + Game.blockPx }, 500, Phaser.Easing.Sinusoidal.InOut, true);

      Game.entities.spaceco.hurt();
    }  
  }

  if(this.input.activePointer.isDown){
    if(Game.hud.isOpen){
      if(this.input.activePointer.x > 575 || this.input.activePointer.y > 460) Game.entities.hud.close();
  
      else if(Game.entities[Game.hud.isOpen] && Game.entities[Game.hud.isOpen].handlePointer) Game.entities[Game.hud.isOpen].handlePointer(this.input.activePointer);
      
      else Game.entities.hud.close();
  
      return;
    }

    else if(Game.game.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 32) < 32){
      return Game.entities.player.useItem(1, Game.itemSlot1.item);
    }

    else if(Game.game.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 106) < 32){
      return Game.entities.player.useItem(2, Game.itemSlot2.item);
    }

    else if(Game.game.math.distance(this.input.activePointer.x, this.input.activePointer.y, 70, 50) < 128){
      return Game.entities.hud.open('hud');
    }
  }

  var moving;

  if(!this.game.tweens.isTweening(Game.drill)){
    var surrounds = Game.entities.player.getSurrounds();

    if(this.input.activePointer.isDown){
      var xDiff = Game.drill.x - this.input.activePointer.x - Game.game.camera.x;
      var yDiff = Game.drill.y - this.input.activePointer.y - Game.game.camera.y;
  
      var xDirection = xDiff > 0 ? 'left' : 'right';
      var yDirection = yDiff > 0 ? 'up' : 'down';
  
      moving = Math.abs(xDiff) > Math.abs(yDiff) ? xDirection : yDirection;
    }

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
    else if(this.input.keyboard.isDown(Phaser.Keyboard.ONE)){
      Game.entities.player.useItem(1, Game.itemSlot1.item);
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.TWO)){
      Game.entities.player.useItem(2, Game.itemSlot2.item);
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
};