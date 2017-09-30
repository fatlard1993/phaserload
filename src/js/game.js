/* global Phaser */
// a static size map is going to require the adoption of camera x scrolling


var Game = {
  config: {
    backgroundColor: '#333',
    textColor: '#227660',
    font: 'monospace',

    hudTextColor: '#94B133',

    width: 832,
    height: 448,
  
    blockSize: 64,
    blockMiddle: 64 * 3.5,
  
    drillMoveTime: {
      safe: 300,
      normal: 300,
      chaos: 100
    },

    storeItemPrices: {
      safe: {
        fuel: 1,
        teleporter: 1
      },
      normal: {
        fuel: 1,
        teleporter: 1,
        hullUpgrade: 1
      }
    },

    storeMineralPurchase: {
      safe: {
        dirt: 'white:~:1',
        diamonds: 'blue:~:1'
      },
      normal: {
        dirt: 'white:~:1',
        diamonds: 'blue:~:1'
      }
    },

    playerStartPos: {
      x: 2,
      y: 4
    },

    mode: 'normal',

    groundDistribution: {
      safe: { ground: 0.7, ground_blue: 0.1, ground_green: 0.2 },
      normal: { ground: 0.7, ground_blue: 0.01, ground_green: 0.12, ground_purple: 0.01, ground_red: 0.15 },
      chaos: { ground: 0.2, ground_blue: 0.16, ground_green: 0.16, ground_purple: 0.16, ground_teal: 0.16, ground_red: 0.16 }
    },

    mineralDistribution: {
      safe: { mineral_green: 0.7, mineral_red: 0.1, mineral_blue: 0.2 },
      normal: { mineral_green: 0.7, mineral_red: 0.1, mineral_blue: 0.2 },
      chaos: { mineral_green: 0.7, mineral_red: 0.1, mineral_blue: 0.2 }
    },

    digTime: {
      safe: {
        ground: 300,
        ground_green: 300,
        ground_blue: 300
      },
      normal: {
        ground_red: 450,
        ground: 500,
        ground_green: 620,
        ground_blue: 700,
        ground_purple: 860
      },
      chaos: {
        ground_red: 100,
        ground: 100,
        ground_green: 100,
        ground_blue: 100,
        ground_teal: 100,
        ground_purple: 100
      }
    },

    blockBehavior: {
      normal: {
        ground_red: 'lava:~:35'
      }
    },

    hudContents: {
      safe: {
        depth: 'Depth'
      },
      normal: {
        position: 'GPS',
        credits: '$',
        fuel: 'Fuel',
        hull: 'Hull',
        mineral_blue: 'CSP32'
      },
      chaos: {
        depth: 'Depth'
      }
    },
  
    monsterWakeupDelay: 600,
    monsterStepDelay: 300,
    monsterMoveSpeed: 400,

    skyHeight: 4,
    maxBlockWidth: 23,
    maxBlockHeight: 500,
    viewBlockHeight: 7
  },
  states: {},
  entities: {},
  rand: function(min, max, excludes){
    excludes = excludes || [];
    
    var num = Math.round(Math.random() * (max - min) + min);

    if(excludes.includes(num)) return Game.rand(min, max, excludes);

    return num;
  },
  chance: function(chance){
    if(chance === undefined){ chance = 50; }
    return chance > 0 && (Math.random() * 100 <= chance);
  },
  weightedChance: function(spec){
    var i, sum = 0, rand = Math.random();
    
    for(i in spec){
      sum += spec[i];

      if(rand <= sum) return i;
    }
  },
  setupStage: function(){
    Game.game.stage.backgroundColor = Game.config.backgroundColor;
  
    Game.game.world.setBounds(0, 0, Game.game.width, 1000 * Game.config.blockSize);
  },
  addRectangle: function(color, width, height){
    var rect = Game.game.add.graphics(0, 0);
    rect.beginFill(color, 1);
    rect.drawRect(0, 0, width || Game.game.width, height || Game.game.height);
    rect.endFill();

    return rect;
  },
  fadeIn: function(length, color, delay){
    if(delay === undefined) delay = 0;
    if(color === undefined) color = 0x000000;
    if(length === undefined) length = 500;

    var curtain = Game.addRectangle(color);
    curtain.alpha = 1;
    Game.game.add.tween(curtain).to({ alpha: 0 }, length, Phaser.Easing.Quadratic.In, true, delay);
  },
  fadeOut: function(length, color, delay){
    if(delay === undefined) delay = 0;
    if(color === undefined) color = 0x000000;
    if(length === undefined) length = 500;

    var curtain = Game.addRectangle(color);
    curtain.alpha = 0;
    Game.game.add.tween(curtain).to({ alpha: 1 }, length, Phaser.Easing.Quadratic.In, true, delay);
  },
  normalizePosition: function(x, y){
    x = Math.floor(x / (Game.config.blockSize / 2)) * (Game.config.blockSize / 2);
    y = Math.floor(y / (Game.config.blockSize / 2)) * (Game.config.blockSize / 2);

    return { x: x, y: y };
  },
  groundAt: function(x, y, dontconvert){
    if(!dontconvert){
      x = Game.toGridPos(x);
      y = Game.toGridPos(y);
    }
    var element = Game.map[x] !== undefined ? (Game.map[x][y] !== undefined ? Game.mapNames[Game.map[x][y]] : 0) : 0;
    
    return element === 'hole' ? 0 : element;
  },
  hull: {},
  displayOpen: false,
  updateHud: function(){
    if(Game.displayOpen) return;
    var hudItemNames = Object.keys(Game.config.hudContents[Game.config.mode]);
    for(var x = 0; x < Game.hudItemCount; x++){
      var item = hudItemNames[x];
      var value = Game.config.hudContents[Game.config.mode][hudItemNames[x]].split(':~:');
      var text = value[0] +': ';
      
      if(item === 'depth') text += Game.depth;
      else if(item === 'position') text += 'x'+ Game.toGridPos(Game.drill.x) +' y'+ Game.toGridPos(Game.drill.y);
      else if(item === 'fuel') text += Game.fuel.toFixed(1);
      else if(item === 'credits') text += Game.credits.toFixed(1);
      else if(item === 'hull') text += Game.hull.space.toFixed(1);
      else{
        if(item.startsWith('mineral') && Game.hull[item]) text += Game.hull[item];
      }

      // console.log('setting: ', 'hudLine'+ (x + 1), ' to: ', text);
  
      Game['hudLine'+ (x + 1)].setText(text);
    }
  },
  openInventory: function(){
    Game.hud.scale.setTo(1, 1);
    
    Game.displayOpen = true;
  },
  closeDialog: function(){
    Game.hud.scale.setTo(0.4, 0.4);
    
    Game.displayOpen = false;
  },
  toGridPos: function(px){
    return Math.round((px - 32) / 64);
  },
  toPx: function(gridPos){
    return (gridPos * 64) + 32;
  },
  offerSpaceco: function(){
    Game.spacecoOffered = true;

    Game.infoLine.setText(' [up] to enter Spaceco ');
  },
  revokeSpaceco: function(){
    Game.spacecoOffered = false;

    Game.spacecoText.setText('');    

    Game.closeDialog();
    
    Game.infoLine.setText(' Good bye! ');

    Game.inSpaceco = false;

    setTimeout(function(){
      Game.infoLine.setText('');
      
      Game.updateHud();
    }, 500);
  },
  drawSpacecoView: function(view){
    Game.spacecoView = view;

    if(view === 'rates'){
      Game.spacecoText.setText(Game.spacecoGreeting + '\n  {Rates} | Fuel | Shop | Exit\n' + Game.spacecoRates);
    }
    else if(view === 'fuel'){
      Game.spacecoText.setText(Game.spacecoGreeting + '\n  Rates | {Fuel} | Shop | Exit\n' + Game.spacecoFuel);
    }
    else if(view === 'shop'){
      Game.spacecoText.setText(Game.spacecoGreeting + '\n  Rates | Fuel | {Shop} | Exit\n' + Game.spacecoProducts);
    }
  },
  spacecoGreeting: ' Welcome to Spaceco, we love you ',
  spacecoRates: '\nCS32 : $8',
  spacecoFuel: '\nGas : $1\nSuper Oxygen Liquid Nitrogen : $2\nEnergy Charge : $1',
  spacecoProducts: '\nTeleporter : $2\nRepair : $4\nUpgrade : $10',
  enterSapceco: function(){
    for(var x = 0; x < Game.hudItemCount; x++){
      Game['hudLine'+ (x + 1)].setText('');
    }

    Game.infoLine.setText('');
    
    Game.hud.scale.setTo(1.5, 1.5);
    
    Game.displayOpen = true;
    Game.inSpaceco = true;

    Game.drawSpacecoView('rates');

    if(Game.config.mode === 'normal'){
      Game.credits += Game.whiteScore * 0.02;
      Game.credits += Game.greenScore * 0.05;
      Game.credits += Game.blueScore * 0.9;
      Game.credits += Game.purpleScore * 1.1;
      Game.credits += Game.hull.mineral_green * 3;
      Game.credits += Game.hull.mineral_red * 4.5;
      Game.credits += Game.hull.mineral_blue * 8;

      Game.whiteScore = 0;
      Game.blueScore = 0;
      Game.greenScore = 0;
      Game.purpleScore = 0;

      Game.hull = {};
      Game.hull.space = 10;
      Game.hull.mineral_green = 0;
      Game.hull.mineral_red = 0;
      Game.hull.mineral_blue = 0;

      Game.fuel += Game.credits;
      Game.credits = 0;

      Game.updateHud();
    }
  },
  mapNames: ['hole', 'monster', 'player1', 'ground', 'ground_red', 'ground_green', 'ground_blue', 'ground_teal', 'ground_purple', 'lava', 'mineral_green', 'mineral_red', 'mineral_blue'],
  generateMap: function(){
    Game.map = [];

    var playerX = Game.rand(0, Game.config.maxBlockWidth - 1);
    
    for(var x = 0; x < Game.config.maxBlockWidth; x++){
      for(var y = 0; y < Game.config.maxBlockHeight; y++){
        var groundChance = 100 - (y * 0.2);
        var mineralChance = y;
        var lavaChance = y * 0.2;
        var monsterChance = y * 0.1;
  
        Game.map[x] = Game.map[x] || [];

        if(y === Game.config.skyHeight && x === playerX) Game.map[x][y] = Game.mapNames.indexOf('player1');
  
        if(y > Game.config.skyHeight && Game.chance(groundChance)){
          Game.map[x][y] = Game.mapNames.indexOf(Game.weightedChance(Game.config.groundDistribution[Game.config.mode]));
        }

        else if(y > Game.config.skyHeight + 3 && Game.chance(mineralChance)){      
          Game.map[x][y] = Game.mapNames.indexOf(Game.weightedChance(Game.config.mineralDistribution[Game.config.mode]));
        }
        
        else if(y > Game.config.skyHeight + 5 && Game.chance(lavaChance)){
          Game.map[x][y] = Game.mapNames.indexOf('lava');
        }
  
        else if(y > Game.config.skyHeight + 5 && Game.chance(monsterChance)){
          Game.map[x][y] = Game.mapNames.indexOf('monster');
        }
  
        else{
          Game.map[x][y] = 0;
        }
      }
    }

    Game.config.playerStartPos.x = playerX;
  },
  findInMap: function(nameOrId){
    var found = [], id = typeof nameOrId === 'string' ? Game.mapNames.indexOf(nameOrId) : nameOrId;

    for(var x = 0; x < Game.config.maxBlockWidth; x++){
      for(var y = 0; y < Game.config.maxBlockHeight; y++){
        if(Game.map[x][y] === id) found.push({ x: x, y: y });
      }
    }

    return found;
  },
  viewBufferSize: 3,
  get viewCenterPos(){
    return { x: (Game.game.camera.x + 832) / 2, y: (Game.game.camera.y + Game.config.height) / 2 };
  },
  get viewBufferCenterPos(){
    return { x: (Game.game.camera.x + 832 + ((Game.viewBufferSize * 2) * 64)) / 2, y: (Game.game.camera.y + Game.config.height + ((Game.viewBufferSize * 2) * 64)) / 2 };
  },
  viewBufferCenterPoint: { x: 608, y: 416 },
  drawView: function(left, top, right, bottom){
    left = Math.max(0, left);
    right = Math.min(Game.config.maxBlockWidth, right);

    console.log('drawing: x'+ left +' y'+ top +' to x'+ right +' y'+ bottom);

    for(var x = left; x < right; x++){
      for(var y = top; y < bottom; y++){
        var element = Game.groundAt(x, y, 1);
  
        if(!element) continue;
        
        if(element.startsWith('ground')){
          Game.entities.ground.create(this.game, Game.toPx(x), Game.toPx(y), element);
        }

        else if(element.startsWith('mineral')){
          Game.entities.mineral.create(Game.game, Game.toPx(x), Game.toPx(y), element);
        }
        
        else if(element === 'lava'){
          Game.entities.lava.create(this.game, Game.toPx(x), Game.toPx(y));
        }
  
        else if(element === 'monster'){
          Game.entities.monster.create(this.game, Game.toPx(x), Game.toPx(y));        
        }
      }
    }
  },
  upkeepView: function(){
    let xDiff = this.viewBufferCenterPos.x - this.viewBufferCenterPoint.x;
    let yDiff = this.viewBufferCenterPos.y - this.viewBufferCenterPoint.y;

    let viewTop = this.toGridPos(this.game.camera.y);
    let viewLeft = this.toGridPos(this.game.camera.x);
    let viewBottom = this.toGridPos(this.game.camera.y + this.config.height);
    let viewRight = this.toGridPos(this.game.camera.x + this.config.width);

    let movingV = yDiff === 0 ? 'not' : yDiff < 0 ? 'up' : 'down';
    let movingH = xDiff === 0 ? 'not' : xDiff < 0 ? 'left' : 'right';
    
    console.log(xDiff, yDiff, movingH, movingV);
    
    if(Math.abs(xDiff) / 32 >= this.viewBufferSize || Math.abs(yDiff) / 32 >= this.viewBufferSize){
      let drawTop = movingV === 'not' ? viewTop : movingV === 'up' ? viewTop - this.viewBufferSize : viewBottom;
      let drawBottom = movingV === 'not' ? viewBottom : movingV === 'up' ? viewTop : viewBottom + this.viewBufferSize;
      let drawLeft = movingH === 'not' ? viewLeft : movingH === 'left' ? viewLeft : viewRight - this.viewBufferSize;
      let drawRight = movingH === 'not' ? viewRight : movingH === 'left' ? viewLeft + this.viewBufferSize : viewRight;

      this.cleanupView();
      this.drawView(drawLeft, drawTop, drawRight, drawBottom);
    }
  },
  cleanupView: function(){
    let viewTop = this.game.camera.y;
    let viewLeft = this.game.camera.x;
    let viewBottom = this.game.camera.y + this.config.height;
    let viewRight = this.game.camera.x + this.config.width;

    function cleanup(entity){
      if(entity.y > viewBottom + (this.viewBufferSize * 64) || entity.y < viewTop - (this.viewBufferSize * 64)){
        entity.kill();
      }
      if(entity.x > viewRight + (this.viewBufferSize * 64) || entity.x < viewLeft - (this.viewBufferSize * 64)){
        entity.kill();
      }
    }

    this.ground.forEachAlive(cleanup);
    this.lava.forEachAlive(cleanup);
    this.monsters.forEachAlive(cleanup);

    this.viewBufferCenterPoint = this.viewBufferCenterPos;
  }
};

window.onload = function(){
  console.log('onload');

  document.getElementById('game').style.marginTop = (document.body.clientHeight - Game.config.height) / 2 +'px';

  // Game.config.width = Math.max(10, Math.floor(document.body.clientWidth / 64)) * 64;
  
  Game.game = new Phaser.Game(Game.config.width, Game.config.height, Phaser.AUTO, 'game');
  
  Game.game.state.add('boot', Game.states.boot);
  Game.game.state.add('load', Game.states.load);
  Game.game.state.add('lobby', Game.states.lobby);
  Game.game.state.add('game', Game.states.game);
  Game.game.state.add('end', Game.states.end);

  console.log('states added');

  Game.game.state.start('boot');
};
