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

  Game.depthText = this.game.add.text(15, 10, 'Depth: 0', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
  
  Game.blueScoreText = this.game.add.text(15, 52, 'Armor: 0', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
  Game.greenScoreText = this.game.add.text(15, 94, 'Fuel: 0', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
  // Game.purpleScoreText = this.game.add.text(15, 136, 'Purple: 0', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });
  // Game.tealScoreText = this.game.add.text(15, 178, 'Teal: 0', { font: '40px '+ Game.config.font, fill: Game.config.hudTextColor, stroke: Game.config.backgroundColor, strokeThickness: 0 });

  Game.hud.addChild(Game.depthText);

  Game.hud.addChild(Game.blueScoreText);
  Game.hud.addChild(Game.greenScoreText);
  // Game.hud.addChild(Game.purpleScoreText);
  // Game.hud.addChild(Game.tealScoreText);

  this.game.input.keyboard.addKeyCapture([
    Phaser.Keyboard.LEFT,
    Phaser.Keyboard.RIGHT,
    Phaser.Keyboard.UP,
    Phaser.Keyboard.DOWN,
    Phaser.Keyboard.SPACEBAR
  ]);

  //setup touch regions
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
  

  this.resetGame();
};

Game.states.game.prototype.resetGame = function(){
  Game.groundMap = [[]];

  this.createGround();

  Game.entities.player.create(this.game, Game.config.blockSize * 1.5, Game.config.blockMiddle);
  Game.drillScaleX = Game.drill.scale.x;

  this.showInstructions();

  Game.depth = 0;
  
  Game.blueScore = 0;
  Game.greenScore = 20;
  // Game.purpleScore = 0;
  // Game.tealScore = 0;

  Game.depthText.setText('Depth: '+ Game.depth);
  
  Game.blueScoreText.setText('Armor: '+ Game.blueScore);
  Game.greenScoreText.setText('Fuel: '+ Game.greenScore);
  // Game.purpleScoreText.setText('Purple: '+ Game.purpleScore);
  // Game.tealScoreText.setText('Teal: '+ Game.tealScore);
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

// Game.states.game.prototype.render = function(){
//   this.game.debug.pointer(this.game.input.mousePointer);
//   this.game.debug.pointer(this.game.input.pointer1);
//   this.game.debug.pointer(this.game.input.pointer2);
// };


Game.states.game.prototype.update = function(){
  if(!Game.greenScore){
    Game.loseReason = 'fuel';
    return this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
  }

  var moving;

  if(!this.game.tweens.isTweening(Game.drill)){
    var surrounds = Game.entities.player.getSurrounds();

    if(this.input.keyboard.isDown(Phaser.Keyboard.LEFT)){//&& Game.drill.x > Game.config.blockSize/2
      moving = 'left';
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){// && Game.drill.x < this.game.width - Game.config.blockSize/2
      moving = 'right';
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.DOWN)){
      moving = 'down';
    }
    else if(this.input.keyboard.isDown(Phaser.Keyboard.UP)){//&& (surrounds.left || surrounds.right)
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
  
      // if(!Game.groundAt(Game.drill.x + Game.config.blockSize, Game.drill.y) && !Game.groundAt(Game.drill.x - Game.config.blockSize, Game.drill.y) && !Game.groundAt(Game.drill.x, Game.drill.y + Game.config.blockSize)){
        
      //   if(Game.entities.player.lastMove === 'up' && Game.groundAt(Game.drill.x + Game.config.blockSize, Game.drill.y + Game.config.blockSize)){
      //     Game.entities.player.move(this.game, 'right');
      //   }
  
      //   else if(Game.entities.player.lastMove === 'up' && Game.groundAt(Game.drill.x - Game.config.blockSize, Game.drill.y + Game.config.blockSize)){
      //     Game.entities.player.move(this.game, 'left');
      //   }
  
      //   else{
      //     Game.entities.player.move(this.game, 'down');
      //   }
      // }
    }
  }

  

  // Lava kills
  Game.lava.forEachAlive(function(lava){
    if(!lava.lethal) return;

    if(this.game.math.distance(Game.drill.x, Game.drill.y, lava.x, lava.y) < Game.config.blockSize/2){
      if(Game.blueScore > 10) Game.blueScore--;
      else Game.drill.kill();
      Game.loseReason = 'lava';
      
      this.game.time.events.add(200, function(){ this.game.state.start('end'); }, this);
    }

    Game.monsters.forEachAlive(function(monster){
      if(this.game.math.distance(monster.x, monster.y, lava.x, lava.y) < Game.config.blockSize){
        monster.kill();
      }
    }, this);
  }, this);

  // Monsters kill
  Game.monsters.forEachAlive(function(monster){
    if(this.game.math.distance(Game.drill.x, Game.drill.y, monster.x, monster.y) < Game.config.blockSize/2){
      if(Game.blueScore > 10) Game.blueScore--;
      else Game.drill.kill();
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
      var difficulty = 100 * (Game.depth / 100);
      var monsterChance = Game.chance(difficulty);
      var groundChance = !Game.chance(difficulty);

      if(y === Game.groundDepth && Game.chance(difficulty)) Game.entities.lava.create(this.game, x, y);

      else if(groundChance){
        Game.entities.ground.create(this.game, x, y);
      }
      
      else if(monsterChance){
        Game.entities.monster.create(this.game, x, y);
      }
    }
  }

  Game.groundDepth = y;
};