/* global Phaser, Game */

Game.states.game = function(game){};

Game.states.game.prototype.create = function(){
  Game.setupStage();

  Game.ground = this.game.add.group();
  Game.lava = this.game.add.group();
  Game.minerals = this.game.add.group();

  Game.teleporter = Game.game.add.sprite(150, 20, 'teleporter');
  Game.teleporter.anchor.setTo(0.5, 0.5);
  Game.teleporter.fixedToCamera = true;  
  
  
  var spacecoX = Game.rand(2, Game.config.maxBlockWidth - 2);  
  Game.spaceco = Game.game.add.sprite(Game.toPx(spacecoX), Game.toPx(Game.config.playerStartPos.y), 'spaceco', 10);
  
  Game.spaceco.anchor.setTo(0.5, 0.69);

  Game.spacecoDamage = 0;
  Game.spaceco.frame = Game.spacecoDamage;
  Game.spaceco.scale.setTo(0.25, 0.25);

  Game.monsters = this.game.add.group();

  Game.generateMap();  

  Game.drawView(Game.config.skyHeight, Game.config.viewBlockHeight + Game.viewBufferSize);
  
  Game.entities.player.create(this.game, Game.toPx(Game.config.playerStartPos.x), Game.toPx(Game.config.playerStartPos.y));

  Game.hud = this.game.add.sprite(0, 0, 'hud');
  Game.hud.scale.setTo(0.4, 0.4);
  Game.hud.fixedToCamera = true;

  var hudItemCount = Game.hudItemCount = Object.keys(Game.config.hudContents[Game.config.mode]).length;

  if(hudItemCount > 0){
    Game.hudLine1 = this.game.add.text(15, 10, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor });
    Game.hud.addChild(Game.hudLine1);
  }
  if(hudItemCount > 1){
    Game.hudLine2 = this.game.add.text(15, 52, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor });
    Game.hud.addChild(Game.hudLine2);
  }
  if(hudItemCount > 2){
    Game.hudLine3 = this.game.add.text(15, 94, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor });
    Game.hud.addChild(Game.hudLine3);
  }
  if(hudItemCount > 3){
    Game.hudLine4 = this.game.add.text(15, 136, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor });
    Game.hud.addChild(Game.hudLine4);
  }
  if(hudItemCount > 4){
    Game.hudLine5 = this.game.add.text(15, 178, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor });
    Game.hud.addChild(Game.hudLine5);
  }

  Game.infoLine = this.game.add.text(15, 320, '', { font: '48px '+ Game.config.font, fill: '#fff', fontWeight: 'bold', backgroundColor: '#111' });
  Game.hud.addChild(Game.infoLine);

  Game.spacecoText = this.game.add.text(20, 20, '', { font: '14px '+ Game.config.font, fill: '#fff', fontWeight: 'bold' });
  Game.hud.addChild(Game.spacecoText);

  this.game.input.keyboard.addKeyCapture([
    Phaser.Keyboard.LEFT,
    Phaser.Keyboard.RIGHT,
    Phaser.Keyboard.UP,
    Phaser.Keyboard.DOWN,
    Phaser.Keyboard.X
  ]);

  var leftQuarter = new Phaser.Rectangle(0, 0, this.game.width/4, this.game.height);
  var middleUpperQuarter = new Phaser.Rectangle(this.game.width/4, 0, this.game.width/2, this.game.height/2);
  var middleLowerQuarter = new Phaser.Rectangle(this.game.width/4, this.game.height/2, this.game.width/2, this.game.height/2);
  var rightQuarter = new Phaser.Rectangle((this.game.width/4) * 3, 0, this.game.width/4, this.game.height);

  var This = this;

  var handleTouchRegions = function(pointer){
    // if(Game.inSpaceco){
      
    //   console.log(pointer, pointer.x, pointer.y);

    //   if(this.game.math.distance(pointer.x, pointer.y, monster.x, monster.y) < Game.config.blockSize/2)

    //   return;
    // }

    if(Game.game.tweens.isTweening(Game.drill)) return;
    var moving;

    if(Game.game.math.distance(pointer.x, pointer.y, 150, 20) < 32){
      moving = 'teleport';
    }
    else if(middleUpperQuarter.contains(pointer.x, pointer.y)){
      moving = 'up';
    }
    else if(middleLowerQuarter.contains(pointer.x, pointer.y)){
      moving = 'down';
    }
    else if(leftQuarter.contains(pointer.x, pointer.y)){
      moving = 'left';
    }
    else if(rightQuarter.contains(pointer.x, pointer.y)){
      moving = 'right';
    }
    
    if(moving){
      console.log(moving);
      Game.entities.player.move(Game.game, moving);
    }
  };

  this.game.input.onDown.add(handleTouchRegions);

  this.showInstructions();

  Game.hull = {};
  Game.hull.space = 10;

  Game.depth = 0;
  Game.credits = 0;
  Game.fuel = Game.config.mode === 'normal' ? 5 : 0;
  
  Game.whiteScore = 0;
  Game.blueScore = 0;
  Game.greenScore = 0;
  Game.redScore = 0;
  Game.purpleScore = 0;
  Game.tealScore = 0;
  Game.hull.mineral_green = 0;
  Game.hull.mineral_red = 0;
  Game.hull.mineral_blue = 0;

  Game.updateHud();
};

Game.states.game.prototype.showInstructions = function(){
  var tweenTime = 500;
  var delay = 0;
  var delayIncrement = 100;
  var text;

  var instructions = this.game.add.group();
  instructions.fixedToCamera = true;

  text = this.game.add.text(0, -100, 'DIG!', { font: '60px ' + Game.config.font, fill: Game.config.textColor, stroke: Game.config.backgroundColor, strokeThickness: 10 });
  instructions.add(text);
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 40 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay).to({ y: -100 }, tweenTime, Phaser.Easing.Cubic.In, true, tweenTime * 3);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement;

  text = this.game.add.text(0, -100, 'Use the arrow keys', { font: '40px ' + Game.config.font, fill: Game.config.textColor, align: 'center', stroke: Game.config.backgroundColor, strokeThickness: 10 });
  instructions.add(text);
  text.updateTransform();
  text.x = this.game.width/2 - text.getBounds().width/2;
  text.alpha = 0;
  this.game.add.tween(text).to({ y: 100 }, tweenTime, Phaser.Easing.Elastic.Out, true, delay).to({ y: -100 }, tweenTime, Phaser.Easing.Cubic.In, true, tweenTime * 3);
  this.game.add.tween(text).to({ alpha: 1 }, tweenTime, Phaser.Easing.Sinusoidal.InOut, true, delay);
  delay += delayIncrement * 25;

  setTimeout(function(){ instructions.destroy(); }, delay);
};

Game.states.game.prototype.update = function(){
  if(Game.config.mode === 'normal' && Game.fuel < 0){
    Game.loseReason = 'fuel';
    return this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
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

    if(!Game.drill.animations.getAnimation('teleporting').isPlaying && this.game.math.distance(Game.drill.x, Game.drill.y, lava.x, lava.y) < Game.config.blockSize/2){
      Game.drill.kill();
      Game.loseReason = 'lava';
      
      this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
    }

    if(this.game.math.distance(Game.spaceco.x, Game.spaceco.y, lava.x, lava.y) < Game.config.blockSize){
      Game.spaceco.kill();
    }

    Game.monsters.forEachAlive(function(monster){
      if(this.game.math.distance(monster.x, monster.y, lava.x, lava.y) < Game.config.blockSize){
        monster.kill();
      }
    }, this);
  }, this);

  Game.monsters.forEachAlive(function(monster){
    if(this.game.math.distance(Game.drill.x, Game.drill.y, monster.x, monster.y) < Game.config.blockSize/2){
      Game.drill.kill();
      Game.loseReason = 'monster';
      
      this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
    }
  }, this);

  if(Game.spacecoDamage < 10 && !this.game.tweens.isTweening(Game.spaceco)){
    var gridPos = {
      x: Game.toGridPos(Game.spaceco.x),
      y: Game.toGridPos(Game.spaceco.y)
    };

    var spacecoGroundBase = {
      bottomRight: Game.map[gridPos.x + 1][gridPos.y + 1],
      bottom: Game.map[gridPos.x][gridPos.y + 1],
      bottomLeft: Game.map[gridPos.x - 1][gridPos.y + 1]
    };

    if(spacecoGroundBase.bottomRight < 3 && spacecoGroundBase.bottom < 3 && spacecoGroundBase.bottomLeft < 3){
      Game.game.add.tween(Game.spaceco).to({ y: Game.spaceco.y + Game.config.blockSize }, 500, Phaser.Easing.Sinusoidal.InOut, true);

      Game.spacecoDamage++;

      if(Game.spacecoDamage === 10) setTimeout(Game.spaceco.kill, 400);
      else Game.spaceco.frame = Game.spacecoDamage;
    }  
  }
};