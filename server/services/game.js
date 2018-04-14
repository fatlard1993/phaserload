const Modes = require(`${__dirname}/_modes`);
const Worlds = require(`${__dirname}/_worlds`);

const Log = require(process.env.DIST ? `${__dirname}/../_log` : `${__dirname}/../../../swiss-army-knife/js/_log`);

var Game = {
	blockPx: 64,
	mineralNames: {
		white: 'tritanium',
		orange: 'duranium',
		yellow: 'pentrilium',
		green: 'byzanium',
		teal: 'etherium',
		blue: 'mithril',
		purple: 'octanium',
		pink: 'saronite',
		red: 'adamantite',
		black: 'quadium'
	},
	mineralColors: ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'],
	mapNames: ['red_monster', 'purple_monster', 'lava', 'poisonous_gas', 'noxious_gas', 'mineral_white', 'mineral_orange', 'mineral_yellow', 'mineral_green', 'mineral_teal', 'mineral_blue', 'mineral_purple', 'mineral_pink', 'mineral_red', 'mineral_black', 'ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black'],
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
	shuffleArr: function(array){
		var currentIndex = array.length, temporaryValue, randomIndex;

		while(currentIndex !== 0){
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex -= 1;

			temporaryValue = array[currentIndex];
			array[currentIndex] = array[randomIndex];
			array[randomIndex] = temporaryValue;
		}

		return array;
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
	randFromArr: function(arr){
		var arrLen = arr.length;

		return arr[Game.rand(0, arrLen - 1)];
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
	toId: function(name){
		return Game.mapNames.indexOf(name);
	},
	toName: function(id){
		return Game.mapNames[id];
	},
	toGridPos: function(px){
		return Math.round((px - 32) / 64);
	},
	toPx: function(gridPos){
		return (gridPos * 64) + 32;
	},
	generateMap: function(mode, worldPack, worldIndex){
		Log()(mode, worldPack, worldIndex);

		var mapData = Object.assign(Modes.list[mode], {
			mode: mode,
			world: Worlds.packs[worldPack][worldIndex !== 'rand' ? worldIndex : Game.rand(0, Worlds.packs[worldPack].length - 1)],
			width: Game.rand(30, 50),
			depth: Game.rand(180, 250),
			map: [],
		});
		// viewBufferMap: []

		var safeLevel = 8;

		var mineralChance, hazardChance, holeChance, layer, hazard, x, y;

		var randMineralChance, randMineralChanceBase = 20;

		for(x = 0; x < mapData.width; ++x){
			for(y = 0; y < mapData.depth; ++y){
				mineralChance = Math.min(70, y * (mapData.world.mineralChance / 100));
				randMineralChance = Math.min(50, (y / 2) * (randMineralChanceBase / 100));
				holeChance = Math.min(25, y * (mapData.world.holeChance / 100));
				hazardChance = Math.min(30, y * (mapData.world.hazardChance / 100));

				layer = mapData.world.layers[Math.ceil(mapData.world.layers.length * (y / mapData.depth)) - 1];

				mapData.map[x] = mapData.map[x] || [];
				mapData.map[x][y] = [-1, -1];

				// mapData.viewBufferMap[x] = mapData.viewBufferMap[x] || [];
				// mapData.viewBufferMap[x][y] = [-1, -1];

				if(y > 1 && !Game.chance(holeChance)){
					// mapData.map[x][y][0] = 'ground_'+ (Game.chance(randMineralChance) ? Game.randFromArr(Game.mineralColors) : Game.weightedChance(layer));
					mapData.map[x][y][0] = Game.mapNames.indexOf('ground_'+ (Game.chance(randMineralChance) ? Game.randFromArr(Game.mineralColors) : Game.weightedChance(layer)));

					if(y > safeLevel && Game.chance(mineralChance)){
						// mapData.map[x][y][1] = 'mineral_'+ (Game.chance(randMineralChance) ? Game.randFromArr(Game.mineralColors) : Game.weightedChance(layer));
						mapData.map[x][y][1] = Game.mapNames.indexOf('mineral_'+ (Game.chance(randMineralChance) ? Game.randFromArr(Game.mineralColors) : Game.weightedChance(layer)));
					}
				}

				else if(y > safeLevel && Game.chance(hazardChance)){
					hazard = Game.weightedChance(mapData.world.hazardDistribution);

					if(hazard === 'gas') hazard = Game.chance(50) ? 'poisonous_gas' : 'noxious_gas';
					else if(hazard === 'monster') hazard = Game.chance(50) ? 'red_monster' : 'purple_monster';

					// mapData.map[x][y][0] = hazard;
					mapData.map[x][y][0] = Game.mapNames.indexOf(hazard);
				}

				else if(y > safeLevel && Game.chance(mineralChance)){
					// mapData.map[x][y][1] = 'mineral_'+ (Game.chance(randMineralChance) ? Game.randFromArr(Game.mineralColors) : Game.weightedChance(layer));
					mapData.map[x][y][1] = Game.mapNames.indexOf('mineral_'+ (Game.chance(randMineralChance) ? Game.randFromArr(Game.mineralColors) : Game.weightedChance(layer)));
				}
			}
		}

		return mapData;
	},
	generatePart: function(){
		var type = Game.randFromArr(['tracks', 'hull', 'drill', 'fuel_tank']);
		var material = Game.weightedChance({ tritanium: 20, duranium: 18, pentrilium: 16, byzanium: 14, etherium: 12, mithril: 8, octanium: 5, saronite: 4, adamantite: 1, quadium: 2 });
		var subTypes = {
			tracks: { boosted_1: 40, boosted_2: 30, boosted_3: 20, antigravidic: 10 },
			hull: { large: 70, oversized: 30 },
			drill: { quadratic: 50, precision_1: 30, precision_2: 20 },
			fuel_tank: { large: 30, oversized: 20, pressurized: 25, battery: 15, condenser: 10 }
		};
		var subType = Game.weightedChance(subTypes[type]);

		var typePrice = { tracks: 10, hull: 10, drill: 10, fuel_tank: 10 };
		var materialPrice = { tritanium: 10, duranium: 15, pentrilium: 25, byzanium: 30, etherium: 40, mithril: 45, octanium: 50, saronite: 55, adamantite: 65, quadium: 80 };
		var subtypePrices = {
			tracks: { boosted_1: 20, boosted_2: 30, boosted_3: 40, antigravidic: 50 },
			hull: { large: 20, oversized: 40 },
			drill: { quadratic: 20, precision_1: 30, precision_2: 50 },
			fuel_tank: { large: 20, oversized: 30, pressurized: 40, battery: 55, condenser: 70 }
		};

		var partName = subType +':~:'+ material +':~:'+ type;
		var partPrice = subtypePrices[type][subType] + materialPrice[material] + typePrice[type];

		return { name: partName, price: partPrice };
	}
};

module.exports = Game;