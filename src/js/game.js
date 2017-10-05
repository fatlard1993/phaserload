/* global Phaser */

var Game = {
  mode: 'normal',
  modes: {},
  blockPx: 64,
  skyHeight: 4,
  config: {
    backgroundColor: '#333',
    font: 'monospace',
    textColor: '#227660',
    hudTextColor: '#94B133'
  },
  states: {},
  entities: {},
  effects: {
    lava: function(chance, pos){
      if(Game.chance(chance)){
        Game.entities.lava.create(Game.game, pos.x, pos.y);
        Game.viewBufferMap[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)] = Game.mapNames.indexOf('lava');
      }
    },
    lavaRelease: function(){
      for(var x = Game.blockPx / 2; x < Game.game.width; x += Game.blockPx){
        for(var y = Game.groundDepth - Game.viewHeight; y < Game.groundDepth; y += Game.blockPx){
          if(Game.chance(90) && Game.groundAt(x, y) === 'ground_red'){
            Game.entities.ground.crush({ x: x, y: y });
            Game.entities.lava.create(Game.game, x, y);
            Game.viewBufferMap[Game.toGridPos(x)][Game.toGridPos(y)] = Game.mapNames.indexOf('lava');
          }
        }
      }
    },
    lavaSolidify: function(radius){
      Game.lava.forEachAlive(function(lava){
        if(Game.game.math.distance(Game.drill.x, Game.drill.y, lava.x, lava.y) < Game.blockPx * (radius || 4)){
          Game.entities.ground.create(Game.game, lava.x, lava.y);
          lava.kill();
        }
      }, this);
    },
    save: function(chance, offChanceFunc){
      if(Game.chance(chance)){
        Game.lava.forEachAlive(function(lava){
          if(Game.chance(85)) lava.kill();
          Game.viewBufferMap[Game.toGridPos(lava.x)][Game.toGridPos(lava.y)] = -1;
        }, this);
    
        Game.monsters.forEachAlive(function(monster){
          if(Game.chance(85)) monster.kill();
          Game.viewBufferMap[Game.toGridPos(monster.x)][Game.toGridPos(monster.y)] = -1;
        }, this);
      }
  
      else if(offChanceFunc) Game.entities.ground.applyBehavior(offChanceFunc);
    }
  },
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
  weightedChance: function(items){
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
    x = Math.floor(x / (Game.blockPx / 2)) * (Game.blockPx / 2);
    y = Math.floor(y / (Game.blockPx / 2)) * (Game.blockPx / 2);

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
  generateMap: function(){
    var settings = Game.modes[Game.mode].levels[Game.modes[Game.mode].level];

    Game.width = Game.rand(settings.size.width[0], settings.size.width[1]);
    Game.depth = Game.rand(settings.size.depth[0], settings.size.depth[1]);

    var mineralRareity = settings.mineralRareity;

    Game.map = []; // todo map[x][y] = [1, 3]
    
    for(var x = 0; x < Game.width; x++){
      for(var y = 0; y < Game.depth; y++){
        var groundChance = 100 - (y * (settings.groundChance || 0.2));
        var mineralChance = y;
        var lavaChance = y * (settings.lavaChance || 0.2);
        var monsterChance = y * (settings.monsterChance || 0.1);

        var groundRareity = settings.levels[Math.ceil(settings.levels.length * (y / Game.depth)) - 1];
  
        Game.map[x] = Game.map[x] || [];
        Game.viewBufferMap[x] = Game.viewBufferMap[x] || [];
        Game.viewBufferMap[x][y] = -1;
  
        if(y > Game.skyHeight && Game.chance(groundChance)){
          Game.map[x][y] = Game.mapNames.indexOf('ground_'+ Game.weightedChance(groundRareity));
        }

        else if(y > Game.skyHeight + 3 && Game.chance(mineralChance)){      
          Game.map[x][y] = Game.mapNames.indexOf(Game.weightedChance(mineralRareity));
        }
        
        else if(y > Game.skyHeight + 5 && Game.chance(lavaChance)){
          Game.map[x][y] = Game.mapNames.indexOf('lava');
        }
  
        else if(y > Game.skyHeight + 5 && Game.chance(monsterChance)){
          Game.map[x][y] = Game.mapNames.indexOf('monster');
        }
  
        else{
          Game.map[x][y] = 0;
        }
      }
    }
  },
  findInMap: function(nameOrId){
    var found = [], id = typeof nameOrId === 'string' ? Game.mapNames.indexOf(nameOrId) : nameOrId;

    for(var x = 0; x < Game.width; x++){
      for(var y = 0; y < Game.depth; y++){
        if(Game.map[x][y] === id) found.push({ x: x, y: y });
      }
    }

    return found;
  },
  showMissionText: function(){
    Game.missionTextOpen = true;
    
    Game.entities.hud.open();
  
    var heading = '           PHASERLOAD\n';
  
    Game.hud.interfaceText.setText(heading + Game.modes[Game.mode].levels[Game.modes[Game.mode].level].missionText);
  },
  viewBufferMap: [],
  viewBufferSize: 3,
  adjustViewPosition: function(newX, newY, time, direction){
    var oldX = Game.game.camera.x;
    var oldY = Game.game.camera.y;
    
    var left = Math.max(0, Game.toGridPos(oldX > newX ? newX : oldX) - Game.viewBufferSize);
    var top = Game.toGridPos(oldY > newY ? newY : oldY) - Game.viewBufferSize;
    var right = Math.min(Game.width, Game.toGridPos((oldX < newX ? newX : oldX) + Game.viewWidth) + Game.viewBufferSize);
    var bottom = Game.toGridPos((oldY < newY ? newY : oldY) + Game.viewHeight) + Game.viewBufferSize;
    
    left = Math.max(0, Math.min(Game.toPx(Game.width) - Game.viewWidth - 32, left));
    newX = Math.max(0, Math.min(Game.toPx(Game.width) - Game.viewWidth - 32, newX));
    
    if(direction) Game.drawViewDirection(direction, Math.abs(oldX - newX), Math.abs(oldY - newY));
    Game.drawView(left, top, right, bottom);

    Game.game.add.tween(Game.game.camera).to({ x: newX, y: newY }, time, Phaser.Easing.Sinusoidal.InOut, true);

    clearTimeout(Game.cleanup_TO);
    Game.cleanup_TO = setTimeout(function(){
      Game.cleanupView();
    }, time + 200);
  },
  drawCurrentView: function(){
    Game.drawView(Game.toGridPos(Game.game.camera.x) - Game.viewBufferSize, Game.toGridPos(Game.game.camera.y) - Game.viewBufferSize, Game.toGridPos(Game.game.camera.x + Game.viewWidth) + Game.viewBufferSize, Game.toGridPos(Game.game.camera.y + Game.viewHeight) + Game.viewBufferSize);
  },
  drawViewDirection: function(direction, distanceX, distanceY){
    var modX = (distanceX || 0) + Game.viewBufferSize;
    var modY = (distanceY || 0) + Game.viewBufferSize;

    var left = direction === 'left' ? Game.toGridPos(Game.game.camera.x) - modX : Game.toGridPos(Game.game.camera.x + Game.viewWidth);
    var top = direction === 'up' ? Game.toGridPos(Game.game.camera.y) - modY : Game.toGridPos(Game.game.camera.y + Game.viewHeight);
    var right = direction === 'right' ? Game.toGridPos(Game.game.camera.x + Game.viewWidth) + modX : Game.toGridPos(Game.game.camera.x + Game.viewWidth);
    var bottom = direction === 'down' ? Game.toGridPos(Game.game.camera.y + Game.viewHeight) + modY : Game.toGridPos(Game.game.camera.y + Game.viewHeight);
    
    Game.drawView(left, top, right, bottom);
  },
  drawView: function(left, top, right, bottom){
    if(top - 3 < 0) top = 0;
    if(left - 3 < 0) left = 0;
    if(bottom + 3 > Game.depth) bottom = Game.depth;
    if(right + 3 > Game.width) right = Game.width;

    console.log('drawing '+ (((bottom - top) + 1) * ((right - left) + 1)) +' sprites, from: x'+ left +' y'+ top +' TO x'+ right +' y'+ bottom);

    for(var x = left; x <= right; x++){
      for(var y = top; y <= bottom; y++){
        var element = Game.groundAt(x, y, 1);

        if(!element) continue;
        if(Game.viewBufferMap[x][y] >= 0){
          // console.log('alerady rendered ', x, y, Game.viewBufferMap[x][y], element);
          continue;
        }
        
        Game.viewBufferMap[x][y] = Game.mapNames.indexOf(element);

        // console.log(x, y, Game.viewBufferMap[x][y], element);
        
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
    if(!force && Game.game.tweens.isTweening(Game.game.camera)) return;

    let viewTop = this.game.camera.y;
    let viewLeft = this.game.camera.x;
    let viewBottom = this.game.camera.y + this.viewHeight;
    let viewRight = this.game.camera.x + this.viewWidth;

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

  let clientHeight = document.body.clientHeight;
  let clientWidth = document.body.clientWidth;

  Game.viewWidth = clientWidth - (clientWidth % Game.blockPx);
  Game.viewHeight = clientHeight - (clientHeight % Game.blockPx);

  if(clientHeight > Game.viewHeight){
    let marginTop = (clientHeight - Game.viewHeight) / 2;
    document.getElementById('game').style.marginTop = marginTop + 'px';
  }
  
  Game.game = new Phaser.Game(Game.viewWidth, Game.viewHeight, Phaser.AUTO, 'game');
  
  Game.game.state.add('boot', Game.states.boot);
  Game.game.state.add('load', Game.states.load);
  Game.game.state.add('lobby', Game.states.lobby);
  Game.game.state.add('play', Game.states.play);
  Game.game.state.add('end', Game.states.end);

  console.log('states added');

  Game.game.state.start('boot');
};