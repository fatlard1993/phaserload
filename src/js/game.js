/* global Phaser */
// a static size map is going to require the adoption of camera x scrolling


var Game = {
  config: {
    backgroundColor: '#333',
    textColor: '#227660',
    font: 'monospace',

    hudTextColor: '#94B133',

    width: 'auto',//832,
    height: 'auto',//448,
  
    blockSize: 64,
    blockMiddle: 64 * 3.5,
  
    drillMoveTime: {
      debug: 200,
      normal: 300
    },

    playerStartPos: {
      x: 2,
      y: 4
    },

    mode: 'normal',//idea: needle in a haystact mode 1 block with a win condition

    groundDistribution: {
      debug: { white: 0.1, orange: 0.1, yellow: 0.1, green: 0.1, teal: 0.1, blue: 0.1, purple: 0.1, pink: 0.1, red: 0.1, black: 0.1 },
      normal: { white: 0.18, orange: 0.18, yellow: 0.15, green: 0.05, teal: 0.04, blue: 0.03, purple: 0.02, pink: 0.02, red: 0.18, black: 0.15 }
    },

    mineralDistribution: {
      debug: { mineral_green: 0.4, mineral_red: 0.3, mineral_blue: 0.3 },
      normal: { mineral_green: 0.7, mineral_red: 0.1, mineral_blue: 0.2 }
    },

    digTime: {
      debug: {
        white: 200,
        orange: 200,
        yellow: 200,
        green: 200,
        teal: 200,
        blue: 200,
        purple: 200,
        pink: 200,
        red: 200,
        black: 200
      },
      normal: {
        white: 400,
        orange: 450,
        yellow: 480,
        green: 500,
        teal: 620,
        blue: 560,
        purple: 580,
        pink: 600,
        red: 350,
        black: 1100
      },
    },

    blockBehavior: {
      normal: {
        ground_red: 'lava:~:35'
      }
    },

    hudContents: {
      debug: {
        position_dbg: '*',
        credits: '$',
        fuel: 'Fuel',
        hull: 'Hull'
      },
      normal: {
        position: '*',
        credits: '$',
        fuel: 'Fuel',
        hull: 'Hull'
      }
    },
  
    monsterWakeupDelay: 600,
    monsterStepDelay: 300,
    monsterMoveSpeed: 400,

    skyHeight: 4,
    maxBlockWidth: 32,
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
      else if(item === 'position_dbg') text += 'x'+ Game.toGridPos(Game.drill.x) +' y'+ Game.toGridPos(Game.drill.y);
      else if(item === 'position') text += 'x'+ (Game.toGridPos(Game.drill.x) + 1) +' y'+ -(Game.toGridPos(Game.drill.y) - Game.config.skyHeight);
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
    Game.updateHud();
    
    Game.infoLine.setText(' Good bye! ');

    Game.inSpaceco = false;

    setTimeout(function(){
      Game.infoLine.setText('');
    }, 800);
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
  spacecoMineralPrices: {
    green: 3,
    red: 4.5,
    blue: 8
  },
  spacecoGreeting: ' Welcome to Spaceco, we love you ',
  spacecoRates: '\n    We basically just rob you,\n              but...\n    We do give you some fuel!',
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
      delete Game.hull.space;

      var mineralNames = Object.keys(Game.hull);

      for(var x = 0; x < mineralNames.length; x++){
        if(mineralNames[x].startsWith('ground')) Game.credits += Game.hull[mineralNames[x]] * Game.config.groundDistribution[Game.config.mode][mineralNames[x].replace('ground_', '')]
        else if(mineralNames[x].startsWith('mineral')){
          Game.credits += Game.hull[mineralNames[x]] * Game.spacecoMineralPrices[mineralNames[x].replace('mineral_', '')];
        }
      }

      Game.hull = {};
      Game.hull.space = 10;

      Game.fuel += Game.credits;
      Game.credits = 0;

      Game.updateHud();
    }
  },
  mapNames: ['hole', 'monster', 'player1', 'lava', 'mineral_green', 'mineral_red', 'mineral_blue', 'ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black'],
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
        Game.viewBufferMap[x] = Game.viewBufferMap[x] || [];
        Game.viewBufferMap[x][y] = -1;

        if(y === Game.config.skyHeight && x === playerX) Game.map[x][y] = Game.mapNames.indexOf('player1');
  
        if(y > Game.config.skyHeight && Game.chance(groundChance)){
          Game.map[x][y] = Game.mapNames.indexOf('ground_'+ Game.weightedChance(Game.config.groundDistribution[Game.config.mode]));
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
  viewBufferMap: [],
  viewBufferSize: 3,
  adjustViewPosition: function(newX, newY, time){
    var oldX = Game.game.camera.x;
    var oldY = Game.game.camera.y;
    
    var left = Game.toGridPos(oldX > newX ? newX : oldX) - Game.viewBufferSize;
    var top = Game.toGridPos(oldY > newY ? newY : oldY) - Game.viewBufferSize;
    var right = Game.toGridPos((oldX < newX ? newX : oldX) + Game.config.width) + Game.viewBufferSize;
    var bottom = Game.toGridPos((oldY < newY ? newY : oldY) + Game.config.height) + Game.viewBufferSize;
    
    left = Math.max(0, Math.min(Game.toPx(Game.config.maxBlockWidth) - Game.config.width - 32, left));
    newX = Math.max(0, Math.min(Game.toPx(Game.config.maxBlockWidth) - Game.config.width - 32, newX));
    
    Game.drawView(left, top, right, bottom);

    Game.game.add.tween(Game.game.camera).to({ x: newX, y: newY }, time, Phaser.Easing.Sinusoidal.InOut, true);

    Game.cleanupView();
  },
  drawCurrentView: function(){
    Game.drawView(Game.toGridPos(Game.game.camera.x) - Game.viewBufferSize, Game.toGridPos(Game.game.camera.y) - Game.viewBufferSize, Game.toGridPos(Game.game.camera.x + Game.config.width) + Game.viewBufferSize, Game.toGridPos(Game.game.camera.y + Game.config.height) + Game.viewBufferSize);    
  },
  drawView: function(left, top, right, bottom){
    if(top - 3 < 0) top = 0;
    if(left - 3 < 0) left = 0;
    if(bottom + 3 > Game.config.maxBlockHeight) bottom = Game.config.maxBlockHeight;
    if(right + 3 > Game.config.maxBlockWidth) right = Game.config.maxBlockWidth;

    console.log('drawing: x'+ left +' y'+ top +' to x'+ right +' y'+ bottom);

    for(var x = left; x < right; x++){
      for(var y = top; y < bottom; y++){
        var element = Game.groundAt(x, y, 1);

        if(!element) continue;
        if(Game.viewBufferMap[x][y] >= 0){
          // console.log('alerady rendered ', x, y, Game.viewBufferMap[x][y], element);
          continue;
        }
        
        Game.viewBufferMap[x][y] = Game.mapNames.indexOf(element);
        
        if(element.startsWith('ground')){
          Game.entities.ground.create(Game.game, Game.toPx(x), Game.toPx(y), element);
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
  cleanupView: function(force){
    let viewTop = this.game.camera.y;
    let viewLeft = this.game.camera.x;
    let viewBottom = this.game.camera.y + this.config.height;
    let viewRight = this.game.camera.x + this.config.width;

    function cleanup(entity){
      var clean = false;

      if(force) clean = true;
      else{
        var pxViewBuffer = Game.toPx(Game.viewBufferSize);
  
        if(entity.y > viewBottom + pxViewBuffer || entity.y < viewTop - pxViewBuffer) clean = true;
        else if(entity.x > viewRight + pxViewBuffer || entity.x < viewLeft - pxViewBuffer) clean = true;
      }

      if(clean){
        Game.viewBufferMap[Game.toGridPos(entity.x)][Game.toGridPos(entity.y)] = -1;
        entity.kill();
      }
    }

    this.ground.forEachAlive(cleanup);
    this.lava.forEachAlive(cleanup);
    this.monsters.forEachAlive(cleanup);
  }
};

window.onload = function(){
  console.log('onload');

  if(Game.config.width === 'auto') Game.config.width = Math.max(10, Math.min(20, Math.floor(document.body.clientWidth / 64))) * 64;
  if(Game.config.height === 'auto'){
    Game.config.height = Math.max(6, Math.min(9, Math.floor(document.body.clientHeight / 64))) * 64;
    
    document.getElementById('game').style.marginTop = (document.body.clientHeight > Game.config.height ? (document.body.clientHeight - Game.config.height) / 5 : 0) +'px';

    if(Game.config.height <= 448){
      Game.config.skyHeight = Game.config.playerStartPos.y = 3;
    }
  }
  
  Game.game = new Phaser.Game(Game.config.width, Game.config.height, Phaser.AUTO, 'game');
  
  Game.game.state.add('boot', Game.states.boot);
  Game.game.state.add('load', Game.states.load);
  Game.game.state.add('lobby', Game.states.lobby);
  Game.game.state.add('game', Game.states.game);
  Game.game.state.add('end', Game.states.end);

  console.log('states added');

  Game.game.state.start('boot');
};
