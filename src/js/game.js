/* global Phaser */

var Game = {
  mode: 'normal',
  modes: {},
  config: {
    backgroundColor: '#333',
    textColor: '#227660',
    font: 'monospace',

    hudTextColor: '#94B133',

    width: 'auto',
    height: 'auto',
  
    blockSize: 64,
    blockMiddle: 64 * 3.5,
  
    drillMoveTime: {
      debug: 200,
      test: 300,
      normal: 300
    },

    playerStartPos: {
      x: 2,
      y: 4
    },

    spacecoMineralPrices: {
      debug: {
        green: 2,
        red: 4,
        blue: 4
      },
      test: {
        green: 2,
        red: 4,
        blue: 4
      },
      normal: {
        green: 3,
        red: 4.5,
        blue: 8
      }
    },

    mode: 'test',//idea: needle in a haystack mode 1 block with a win condition

    asteroidComposition: {

    },

    groundDistribution: {
      debug: { white: 0.1, orange: 0.1, yellow: 0.1, green: 0.1, teal: 0.1, blue: 0.1, purple: 0.1, pink: 0.1, red: 0.1, black: 0.1 },
      test: { white: 0.01, orange: 0.24, yellow: 0.3, green: 0.25, teal: 0.01, blue: 0.01, purple: 0.01, pink: 0.01, red: 0.01, black: 0.15 },
      normal: { white: 0.18, orange: 0.18, yellow: 0.15, green: 0.05, teal: 0.04, blue: 0.03, purple: 0.02, pink: 0.02, red: 0.18, black: 0.15 }
    },

    mineralDistribution: {
      debug: { mineral_green: 0.4, mineral_red: 0.3, mineral_blue: 0.3 },
      test: { mineral_green: 0.4, mineral_red: 0.3, mineral_blue: 0.3 },
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
      test: {
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
      test: {
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
  weightedChance2: function(items){
    var sum = 0, rand = Math.random() * 100;

    var itemNames = Object.keys(items);
    
    for(var x = 0; x < itemNames.length; x++){
      sum += items[itemNames[x]];

      if(rand <= sum) return itemNames[x];
    }
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
  toGridPos: function(px){
    return Math.round((px - 32) / 64);
  },
  toPx: function(gridPos){
    return (gridPos * 64) + 32;
  },
  mapNames: ['hole', 'monster', 'player1', 'lava', 'mineral_green', 'mineral_red', 'mineral_blue', 'ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black'],
  generateMap: function(settings){
    settings = settings || {};

    var width = settings.width || Game.config.maxBlockWidth;
    var height = settings.height || Game.config.maxBlockHeight;
    var groundRareity = settings.groundRareity || Game.config.groundDistribution[Game.config.mode];
    var mineralRareity = settings.mineralRareity || Game.config.mineralDistribution[Game.config.mode];

    Game.map = []; // todo map[x][y] = [1, 3]

    var playerX = Game.rand(0, Game.config.maxBlockWidth - 1);
    
    for(var x = 0; x < width; x++){
      for(var y = 0; y < height; y++){
        var groundChance = 100 - (y * (settings.groundChance || 0.2));
        var mineralChance = y;
        var lavaChance = y * (settings.lavaChance || 0.2);
        var monsterChance = y * (settings.monsterChance || 0.1);

        if(settings.levels){
          groundRareity = settings.levels[settings.levels.length / (height / y) * y];
        }
  
        Game.map[x] = Game.map[x] || [];
        Game.viewBufferMap[x] = Game.viewBufferMap[x] || [];
        Game.viewBufferMap[x][y] = -1;

        if(y === Game.config.skyHeight && x === playerX) Game.map[x][y] = Game.mapNames.indexOf('player1');
  
        if(y > Game.config.skyHeight && Game.chance(groundChance)){
          Game.map[x][y] = Game.mapNames.indexOf('ground_'+ Game.weightedChance(groundRareity));
        }

        else if(y > Game.config.skyHeight + 3 && Game.chance(mineralChance)){      
          Game.map[x][y] = Game.mapNames.indexOf(Game.weightedChance(mineralRareity));
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
    Game.config.height = Math.max(4, Math.min(13, Math.floor(document.body.clientHeight / 64))) * 64;
    
    document.getElementById('game').style.marginTop = (document.body.clientHeight > Game.config.height ? (document.body.clientHeight - Game.config.height) / 5 : 0) +'px';

    if(Game.config.height <= 460){
      Game.config.skyHeight = Game.config.playerStartPos.y = 2;
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
