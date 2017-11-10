const Modes = require('./_modes.js');
const Worlds = require('./_worlds.js');

var Game = {
  blockPx: 64,
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
  normalizePosition: function(x, y){
    x = Math.floor(x / (Game.blockPx / 2)) * (Game.blockPx / 2);
    y = Math.floor(y / (Game.blockPx / 2)) * (Game.blockPx / 2);

    return { x: x, y: y };
  },
  mapPosName: function(x, y){
    return Game.mapNames[Game.mapPos(x, y)[0]];
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
  hull: {},
  toGridPos: function(px){
    return Math.round((px - 32) / 64);
  },
  toPx: function(gridPos){
    return (gridPos * 64) + 32;
  },
  generateMap: function(mode){
    var worlds = Worlds.categories[Modes[mode].worldCategory];
    var settings = worlds[Game.rand(0, worlds.length)];

    var mapData = Object.assign(Modes[mode], {
      mode: mode,
      world: settings,
      width: Game.rand(settings.size.width[0], settings.size.width[1]),
      depth: Game.rand(settings.size.depth[0], settings.size.depth[1]),
      map: [],
      viewBufferMap: []
    });

    var mineralRareity = settings.mineralRareity;

    for(var x = 0; x < mapData.width; x++){
      for(var y = 0; y < mapData.depth; y++){
        var holeChance = y * settings.holeChance;
        var mineralChance = y * settings.mineralChance;
        var lavaChance = y * settings.lavaChance;
        var gasChance = y * settings.gasChance;
        var monsterChance = y * settings.monsterChance;

        var groundRareity = settings.layers[Math.ceil(settings.layers.length * (y / mapData.depth)) - 1];

        mapData.map[x] = mapData.map[x] || [];
        mapData.map[x][y] = [-1, -1];

        mapData.viewBufferMap[x] = mapData.viewBufferMap[x] || [];
        mapData.viewBufferMap[x][y] = [-1, -1];

        if(y > 1 && !Game.chance(holeChance)){
          mapData.map[x][y] = [Game.mapNames.indexOf('ground_'+ Game.weightedChance(groundRareity)), -1];

          if(y > 5 && Game.chance(mineralChance)){
            mapData.map[x][y][1] = Game.mapNames.indexOf('mineral_'+ Game.weightedChance(mineralRareity));
          }
        }

        else if(y > 8 && Game.chance(lavaChance)){
          mapData.map[x][y] = [Game.mapNames.indexOf('lava'), -1];
        }

        else if(y > 8 && Game.chance(gasChance)){
          mapData.map[x][y] = [Game.mapNames.indexOf('gas'), -1];
        }

        else if(y > 8 && Game.chance(monsterChance)){
          mapData.map[x][y] = [Game.mapNames.indexOf('monster'), -1];
        }
      }
    }

    return mapData;
  }
};

module.exports = Game;