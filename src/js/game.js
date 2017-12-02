/* global Phaser, screenfull, io, Log, Socket */

var Game = {
  blockPx: 64,
  config: {
    backgroundColor: '#333',
    font: 'monospace',
    textColor: '#227660',
    hudTextColor: '#94B133'
  },
  states: {},
  entities: {},
  effects: {
    explode: function(pos, radius){
      if(Game.game.math.distance(pos.x, pos.y, Game.spaceco.x, Game.spaceco.y) < Game.blockPx * (radius + 1)){
        Game.entities.spaceco.hurt((radius + 1) - (Game.game.math.distance(pos.x, pos.y, Game.spaceco.x, Game.spaceco.y) / Game.blockPx), 'an explosion');
      }

      if(Game.game.math.distance(pos.x, pos.y, Game.config.players[Game.config.playerName].x, Game.config.players[Game.config.playerName].y) < Game.blockPx * radius){
        Game.entities.player.hurt(Game.randFloat(radius, radius * 2) * (radius - (Game.game.math.distance(pos.x, pos.y, Game.config.players[Game.config.playerName].x, Game.config.players[Game.config.playerName].y) / Game.blockPx)), 'explosion');
      }

      Game.ground.forEachAlive(function(ground){
        if(Game.game.math.distance(pos.x, pos.y, ground.x, ground.y) < Game.blockPx * radius){
          Game.entities.ground.crush({ x: ground.x, y: ground.y });
        }
      });

      Game.monsters.forEachAlive(function(monster){
        if(Game.game.math.distance(pos.x, pos.y, monster.x, monster.y) < Game.blockPx * radius){
          monster.kill();

          Game.setMapPos({ x: monster.x, y: monster.y }, -1);
        }
      });
    },
    freeze: function(pos, radius){
      Game.lava.forEachAlive(function(lava){
        if(Game.game.math.distance(pos.x, pos.y, lava.x, lava.y) < Game.blockPx * radius){
          lava.kill();

          Game.entities.ground.create(lava.x, lava.y);
        }
      });
    },
    lava: function(chance, pos){
      if(Game.chance(chance)){
        Game.entities.lava.create(pos.x, pos.y, 1);
      }
    },
    gas: function(chance, pos){
      if(Game.chance(chance)){
        Game.entities.gas.create(pos.x, pos.y, 1);
      }
    },
    lavaRelease: function(){
      for(var x = Game.blockPx / 2; x < Game.Game.config.width; x += Game.blockPx){
        for(var y = Game.groundDepth - Game.viewHeight; y < Game.groundDepth; y += Game.blockPx){
          if(Game.chance(90) && Game.mapPos(x, y) === 'ground_red'){
            Game.entities.ground.crush({ x: x, y: y });
            Game.entities.lava.create(x, y, 1);
          }
        }
      }
    }
  },
  rand: function(min, max, excludes){
    excludes = excludes || [];

    var num = Math.round(Math.random() * (max - min) + min);

    if(excludes.includes(num)) return Game.rand(min, max, excludes);

    return num;
  },
  randFloat: function(min, max){
    var num = Math.random() * (max - min) + min;

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
    rect.drawRect(0, 0, width || Game.Game.config.width, height || Game.game.height);
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
  notify: function(text, timeout){
    if(Game.notify_TO){
      clearTimeout(Game.notify_TO);

      Game.infoLine.setText('');
    }

    Game.infoLine.setText(' '+ text +' ');

    Game.notify_TO = setTimeout(function(){
      if(Game.infoLine) Game.infoLine.setText('');
    }, (timeout || 3) * 1000);
  },
  mapPos: function(x, y){
    return Game.config.map[x] !== undefined ? (Game.config.map[x][y] !== undefined ? Game.config.map[x][y] : [-1, -1]) : [-1, -1];
  },
  mapPosName: function(x, y){
    return Game.mapNames[Game.mapPos(x, y)[0]];
  },
  viewBufferPos: function(x, y){
    return Game.config.viewBufferMap[x] !== undefined ? (Game.config.viewBufferMap[x][y] !== undefined ? Game.config.viewBufferMap[x][y] : [-1, -1]) : [-1, -1];
  },
  groundAt(pxX, pxY){
    return Game.mapPos(Game.toGridPos(pxX), Game.toGridPos(pxY))[0] > 3 ? Game.mapNames[Game.mapPos(Game.toGridPos(pxX), Game.toGridPos(pxY))[0]] : undefined;
  },
  mapNames: ['monster', 'lava', 'gas', 'player1', 'mineral_green', 'mineral_red', 'mineral_blue', 'mineral_purple', 'mineral_teal', 'mineral_???', 'ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black'],
  toId: function(name){
    return Game.mapNames.indexOf(name);
  },
  toName: function(id){
    return Game.mapNames[id];
  },
  toFixed: function(num, decimalPlaces){
    var re = new RegExp('^-?\\d+(?:.\\d{0,' + (decimalPlaces || -1) + '})?');
    return num.toString().match(re)[0];
  },
  capitalize: function(str, recursive, split){
    for(var i = 0, words = str.split(split || ' '); i < (recursive ? words.length : 1); i++){
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }

    return words.join(' ');
  },
  hull: {},
  toGridPos: function(px){
    return Math.round((px - 32) / 64);
  },
  toPx: function(gridPos){
    return (gridPos * 64) + 32;
  },
  findInMap: function(nameOrId){
    var found = [], id = typeof nameOrId === 'string' ? Game.mapNames.indexOf(nameOrId) : nameOrId;

    for(var x = 0; x < Game.config.width; x++){
      for(var y = 0; y < Game.config.depth; y++){
        if(Game.config.map[x][y][0] === id || Game.config.map[x][y][1] === id) found.push({ x: x, y: y });
      }
    }

    return found;
  },
  showMissionText: function(){
    Game.entities.hud.open('missionText');

    var heading = '           PHASERLOAD\n';

    Game.hud.interfaceText.setText(heading + Game.config.world.missionText);
  },
  setMapPos: function(pos, id){
    var gridPos = {
      x: Game.toGridPos(pos.x),
      y: Game.toGridPos(pos.y)
    };

    console.log('setMapPos', gridPos, 'from', Game.mapPosName(pos.x, pos.y), 'to', Game.mapNames[id]);

    Game.config.map[gridPos.x][gridPos.y][0] = id;
    // Game.config.viewBufferMap[gridPos.x][gridPos.y][0] = id;

    Socket.active.emit('setMapPos', { pos: gridPos, id: id });
  },
  updateMapPos: function(pos, id){
    console.log('updateMapPos', pos, Game.mapNames[id]);

    if(id === -1 || Game.config.map[pos.x][pos.y][0] >= 0) Game.cleanGroundSpriteAt(Game.toPx(pos.x), Game.toPx(pos.y));
    else Game.drawTile(pos.x, pos.y, Game.toName(id));

    Game.config.map[pos.x][pos.y][0] = id;
    // Game.config.viewBufferMap[pos.x][pos.y][0] = -1;
  },
  viewBufferMap: [],
  viewBufferSize: 3,
  adjustViewPosition: function(newX, newY, time, direction){
    console.log('adjustViewPosition');

    var oldX = Game.game.camera.x;
    var oldY = Game.game.camera.y;

    var left = Math.max(0, Game.toGridPos(oldX > newX ? newX : oldX) - Game.viewBufferSize);
    var top = Game.toGridPos(oldY > newY ? newY : oldY) - Game.viewBufferSize;
    var right = Math.min(Game.config.width, Game.toGridPos((oldX < newX ? newX : oldX) + Game.viewWidth) + Game.viewBufferSize);
    var bottom = Game.toGridPos((oldY < newY ? newY : oldY) + Game.viewHeight) + Game.viewBufferSize;

    left = Math.max(0, Math.min(Game.toPx(Game.config.width) - Game.viewWidth - 32, left));
    newX = Math.max(0, Math.min(Game.toPx(Game.config.width) - Game.viewWidth - 32, newX));

    // if(direction) Game.drawViewDirection(direction, Math.abs(oldX - newX), Math.abs(oldY - newY));
    // Game.drawView(left, top, right, bottom);

    Game.game.add.tween(Game.game.camera).to({ x: newX, y: newY }, time, Phaser.Easing.Sinusoidal.InOut, true);

    clearTimeout(Game.cleanup_TO);
    Game.cleanup_TO = setTimeout(function(){
      Game.cleanupView();
    }, time + 200);
  },
  drawCurrentView: function(){
    console.log('drawCurrentView');

    Game.drawView(Game.toGridPos(Game.game.camera.x) - Game.viewBufferSize, Game.toGridPos(Game.game.camera.y) - Game.viewBufferSize, Game.toGridPos(Game.game.camera.x + Game.viewWidth) + Game.viewBufferSize, Game.toGridPos(Game.game.camera.y + Game.viewHeight) + Game.viewBufferSize);
  },
  drawViewDirection: function(direction, distanceX, distanceY){
    console.log('drawViewDirection');

    var modX = (distanceX || 0) + Game.viewBufferSize;
    var modY = (distanceY || 0) + Game.viewBufferSize;

    var left = direction === 'left' ? Game.toGridPos(Game.game.camera.x) - modX : Game.toGridPos(Game.game.camera.x + Game.viewWidth);
    var top = direction === 'up' ? Game.toGridPos(Game.game.camera.y) - modY : Game.toGridPos(Game.game.camera.y + Game.viewHeight);
    var right = direction === 'right' ? Game.toGridPos(Game.game.camera.x + Game.viewWidth) + modX : Game.toGridPos(Game.game.camera.x + Game.viewWidth);
    var bottom = direction === 'down' ? Game.toGridPos(Game.game.camera.y + Game.viewHeight) + modY : Game.toGridPos(Game.game.camera.y + Game.viewHeight);

    Game.drawView(left, top, right, bottom);
  },
  drawView: function(left, top, right, bottom){
    console.log('drawView');

    if(top - 3 < 0) top = 0;
    if(left - 3 < 0) left = 0;
    if(bottom + 3 > Game.config.depth) bottom = Game.config.depth;
    if(right + 3 > Game.config.width) right = Game.config.width;

    Log()('drawing '+ (((bottom - top) + 1) * ((right - left) + 1)) +' sprites, from: x'+ left +' y'+ top +' TO x'+ right +' y'+ bottom);

    var drawn = 0;

    for(var x = left; x <= right; x++){
      for(var y = top; y <= bottom; y++){
        var mapPos = Game.mapPos(x, y);
        var viewBufferPos = Game.viewBufferPos(x, y);

        if((viewBufferPos[0] === mapPos[0] && mapPos[1] < 0) || (mapPos[0] < 0 && mapPos[1] < 0)) continue;

        var mapPos_0_name = Game.toName(mapPos[0]);

        if(mapPos[1] > 0){
          Game.entities.mineral.create(Game.toPx(x), Game.toPx(y), Game.toName(mapPos[1]));
        }

        Game.drawTile(x, y, mapPos_0_name);
        drawn++;
      }
    }

    console.log('drew: ', drawn);
  },
  drawTile: function(x, y, mapPos_0_name){
    if(!mapPos_0_name) return;

    Game.config.viewBufferMap[x][y] = Game.config.map[x][y];

    if(mapPos_0_name.startsWith('ground')){
      Game.entities.ground.create(Game.toPx(x), Game.toPx(y), mapPos_0_name);
    }

    else if(mapPos_0_name === 'lava'){
      Game.entities.lava.create(Game.toPx(x), Game.toPx(y));
    }

    else if(mapPos_0_name === 'gas'){
      Game.entities.gas.create(Game.toPx(x), Game.toPx(y));
    }

    else if(mapPos_0_name === 'monster'){
      Game.entities.monster.create(Game.toPx(x), Game.toPx(y));
    }
  },
  cleanGroundSpriteAt: function(x, y){
    console.log('cleanGroundSpriteAt', x, y);

    function cleanup(entity){
      if(entity.x === x && entity.y === y){
        Game.config.viewBufferMap[Game.toGridPos(entity.x)][Game.toGridPos(entity.y)][0] = -1;
        console.log('killing: ', entity);
        entity.kill();
      }
    }

    this.ground.forEachAlive(cleanup);
    this.lava.forEachAlive(cleanup);
    this.monsters.forEachAlive(cleanup);
  },
  cleanupView: function(force){
    if(!force && Game.game.tweens.isTweening(Game.game.camera) || 1) return;
    console.log('cleanupView');

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
        // else if(Game.config.map[Game.toGridPos(entity.x)][Game.toGridPos(entity.y)][0] === -1 && Game.config.viewBufferMap[Game.toGridPos(entity.x)][Game.toGridPos(entity.y)][0] >= 0) clean = true;
      }

      if(clean){
        Game.config.viewBufferMap[Game.toGridPos(entity.x)][Game.toGridPos(entity.y)][0] = -1;
        console.log('killing: ', entity);
        entity.kill();
      }
    }

    this.ground.forEachAlive(cleanup);
    this.lava.forEachAlive(cleanup);
    this.monsters.forEachAlive(cleanup);
  },
  dev: function(){
    Game.fuel = Game.health = Game.hull.space = Game.credits = 999;

    Game.config.players[Game.config.playerName].upgrade = 3;

    Game.inventory = {
      teleporter: 99,
      responder_teleporter: 99,
      timed_charge: 99,
      remote_charge: 99,
      timed_freeze_charge: 99,
      remote_freeze_charge: 99
    };

    Game.entities.itemSlot.setItem(1, 'responder_teleporter');
    Game.entities.itemSlot.setItem(2, 'timed_charge');
  }
};