/* global Phaser, Game */

Game.states.game = function(game){};

Game.states.game.prototype.create = function(){
  Game.setupStage();

  Game.ground = this.game.add.group();
  Game.lava = this.game.add.group();
  Game.monsters = this.game.add.group();

  Game.hud = this.game.add.sprite(0, 0, 'hud');
  Game.hud.scale.setTo(0.4, 0.4);
  Game.hud.fixedToCamera = true;

  var hudItemCount = Game.hudItemCount = Object.keys(Game.config.hudContents[Game.config.mode]).length;

  if(hudItemCount > 0){
    Game.hudLine1 = this.game.add.text(15, 10, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
    Game.hud.addChild(Game.hudLine1);
  }
  if(hudItemCount > 1){
    Game.hudLine2 = this.game.add.text(15, 52, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
    Game.hud.addChild(Game.hudLine2);
  }
  if(hudItemCount > 2){
    Game.hudLine3 = this.game.add.text(15, 94, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
    Game.hud.addChild(Game.hudLine3);
  }
  if(hudItemCount > 3){
    Game.hudLine4 = this.game.add.text(15, 136, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
    Game.hud.addChild(Game.hudLine4);
  }
  if(hudItemCount > 4){
    Game.hudLine5 = this.game.add.text(15, 178, '', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
    Game.hud.addChild(Game.hudLine5);
  }

  this.game.input.keyboard.addKeyCapture([
    Phaser.Keyboard.LEFT,
    Phaser.Keyboard.RIGHT,
    Phaser.Keyboard.UP,
    Phaser.Keyboard.DOWN,
    Phaser.Keyboard.SPACEBAR
  ]);

  var leftQuarter = new Phaser.Rectangle(0, 0, this.game.width/4, this.game.height);
  var middleUpperQuarter = new Phaser.Rectangle(this.game.width/4, 0, this.game.width/2, this.game.height/2);
  var middleLowerQuarter = new Phaser.Rectangle(this.game.width/4, this.game.height/2, this.game.width/2, this.game.height/2);
  var rightQuarter = new Phaser.Rectangle((this.game.width/4) * 3, 0, this.game.width/4, this.game.height);

  var This = this;

  var handleTouchRegions = function(pointer){
    if(Game.game.tweens.isTweening(Game.drill)) return;
    var moving;

    if(middleUpperQuarter.contains(pointer.x, pointer.y)){
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
      
      if(Game.game.camera.y + Game.game.camera.height > Game.groundDepth - Game.config.blockSize){
        This.addMoreGround();
      }
    }
  };

  this.game.input.onDown.add(handleTouchRegions);

  Game.groundMap = [[]];
  
  // this.createGround();

  // a static size map is going to require the adoption of camera x scrolling

  Game.generateMap();

  console.log(Game.map);

  for(var x = 0; x < Game.config.blockWidth; x++){
    for(var y = Game.config.skyHeight; y < Game.config.viewBlockHeight; y++){
      var element = Game.mapNames[Game.map[x][y]];

      // console.log(element);

      if(element.startsWith('ground')){
        Game.entities.ground.create(this.game, Game.toPx(x), Game.toPx(y), element);
      }
      
      else if(element === 'lava'){
        Game.entities.lava.create(this.game, Game.toPx(x), Game.toPx(y));
      }

      else if(element === 'monster'){
        Game.entities.monster.create(this.game, Game.toPx(x), Game.toPx(y));        
      }
    }
  }

  Game.entities.player.create(this.game, Game.toPx(Game.config.playerStartPos.x), Game.toPx(Game.config.playerStartPos.y));
  Game.drillScaleX = Game.drill.scale.x;

  this.showInstructions();

  Game.depth = 0;
  
  Game.whiteScore = 0;
  Game.blueScore = 0;
  Game.greenScore = Game.config.mode === 'normal' ? 5 : 0;
  Game.redScore = 0;
  Game.purpleScore = 0;
  Game.tealScore = 0;

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
  if(Game.config.mode === 'normal' && Game.greenScore < 0){
    Game.loseReason = 'fuel';
    return this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
  }

  var moving;

  if(!1 && !this.game.tweens.isTweening(Game.drill)){
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

    if(moving){
      Game.entities.player.move(this.game, moving);
      
      if(this.game.camera.y + this.game.camera.height > Game.groundDepth - Game.config.blockSize){
        this.addMoreGround();
      }
    }

    else if(!Game.entities.player.justMoved){
      if(!surrounds.left && !surrounds.right && !surrounds.bottom){
        var direction;
        
        if(Game.entities.player.lastMove === 'up' && (surrounds.bottomLeft || surrounds.bottomRight)){
          direction = surrounds.bottomLeft && !surrounds.bottomRight ? 'left' : (surrounds.bottomLeft && surrounds.bottomRight ? (!Game.entities.player.lastMoveInvert ? 'left' : 'right') : 'right');
        }
        else direction = 'down';

        console.log('Automove from: '+ Game.entities.player.lastMove +' to: '+ direction, surrounds);

        Game.entities.player.move(this.game, direction);
      }
    }
  }

  Game.lava.forEachAlive(function(lava){
    if(!lava.lethal) return;

    if(this.game.math.distance(Game.drill.x, Game.drill.y, lava.x, lava.y) < Game.config.blockSize/2){
      Game.drill.kill();
      Game.loseReason = 'lava';
      
      this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
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
};

Game.states.game.prototype.createGround = function(){
  Game.groundDepth = Game.config.blockMiddle + Game.config.blockSize;

  this.addMoreGround();
};

Game.states.game.prototype.addMoreGround = function(){
  if(this.game.camera.y + this.game.camera.height < Game.groundDepth - Game.config.blockSize) return;

  var x, y;
  for(x = Game.config.blockSize * 0.5; x < this.game.width; x += Game.config.blockSize){
    for(y = Game.groundDepth; y < Game.groundDepth + Game.config.blockSize * 5; y += Game.config.blockSize){
      if(this.game.camera.y < 5 || !Game.chance(Game.config.holeChance[Game.config.mode])){
        Game.entities.ground.create(this.game, x, y);
      }
      
      else if(Game.chance(Game.config.lavaChance[Game.config.mode])){
        Game.entities.lava.create(this.game, x, y);
      }

      else if(Game.chance(Game.config.monsterChance[Game.config.mode])){
        Game.entities.monster.create(this.game, x, y);
      }
    }
  }

  Game.groundDepth = y;
};