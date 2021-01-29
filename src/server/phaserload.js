const fs = require('fs');
const path = require('path');

const log = new (require('log'))({ tag: 'phaserload' });
const util = require('js-util');
const fsExtended = require('fs-extended');

const phaserload = module.exports = {
	options: { // todo make these options configurable
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
		items: {
			teleporter: {
				useEffects: ['teleport:~:spaceco']
			},
			responder_teleporter: {
				useEffects: ['teleport:~:responder']
			},
			repair_nanites: {
				useEffects: ['heal'],
				interactEffects: ['repair:~:95:~:25']
			},
			timed_charge: {
				useEffects: ['explode:~:3'],
				interactEffects: ['intractable:~:disarm']
			},
			remote_charge: {
				useEffects: ['explode:~:5'],
				interactEffects: ['intractable:~:disarm']
			},
			timed_freeze_charge: {
				useEffects: ['freeze:~:3'],
				interactEffects: ['intractable:~:disarm']
			},
			remote_freeze_charge: {
				useEffects: ['freeze:~:5'],
				interactEffects: ['intractable:~:disarm']
			},
			tombstone: {
				interactEffects: ['intractable:~:tombstone']
			},
			satchel: {
				interactEffects: ['intractable:~:satchel']
			}
		}
	},
	rootFolder: path.resolve(__dirname, '../..'),
	init: function(options){
		this.options = Object.assign(this.options, options);

		require('./debugPrompt');

		const { app } = require('http-server').init(options.port, this.rootFolder);

		require('./router');

		this.socketServer = new (require('./socketServer'))(app.server);

		this.loadDataPack('modes');
		this.loadDataPack('worlds');
	},
	loadDataPack: function(name, done){
		//todo add parts datapacks

		const packPath = path.join(this.rootFolder, 'src', name);

		this[name] = this[name] = {};

		fsExtended.browse(packPath, (data) => {
			log(`Importing ${data.files.length} packs from ${packPath}`);

			data.files.forEach((file) => {
				try{
					var packData = JSON.parse(fsExtended.catSync(file));
				}

				catch(err){
					return log.error(`Error parsing pack ${file}`, err);
				}

				const packName = file.replace(new RegExp(packPath +'/'), '').replace('.json', '');

				this[name][packName] = packData;

				log(`Loaded "${packName}"`);
			});

			if(done) done();
		});
	},
	generateWorld: function(mode, worldPack, worldIndex){
		log()('generateWorld', mode, worldPack, worldIndex);

		phaserload.options.itemNames = Object.keys(phaserload.options.items);

		if(worldIndex === 'rand') worldIndex = util.randInt(0, this.worlds[worldPack].length - 1);

		const options = Object.assign({
			name: 'randomWorld',
			index: worldIndex,
			airGap: 1,
			holeChance: 50,
			mineralChance: 50,
			hazardChance: 50,
			itemChance: 1,
			safeDepth: 9,
			items: 'random',
			hazards: 'random',
			layers: [ { ground: 'random' } ]
		}, this.worlds[worldPack][worldIndex]);

		if(options.airGap instanceof Array) options.airGap = util.randInt.apply(null, options.airGap);
		if(options.safeDepth instanceof Array) options.safeDepth = util.randInt.apply(null, options.safeDepth);

		log()('options', options);

		const world = {
			pack: worldPack,
			airGap: options.airGap,
			map: [],
			width: [30, 50],
			gravity: [300, 900],
			depth: [180, 250],
			groundEffects: Object.assign({
				white: ['bonus:~:2:~:white:~:[1,2]'],
				orange: ['bonus:~:2:~:orange:~:[1,2]'],
				yellow: ['bonus:~:2:~:yellow:~:[1,2]'],
				green: ['poisonous_gas:~:12'],
				teal: ['teleporting:~:5'],
				blue: ['freezing:~:15'],
				purple: ['noxious_gas:~:12'],
				pink: ['bonus:~:10:~:pink:~:1', 'exploding:~:10'],
				red: ['bonus:~:2:~:red:~:[1,2]', 'lava:~:35', 'exploding:~:5'],
				black: ['impenetrable']
			}, this.modes[mode].groundEffects || {}),
			densities: Object.assign({
				white: 400,
				orange: 500,
				yellow: 560,
				green: 620,
				teal: 700,
				blue: 740,
				purple: 760,
				pink: 780,
				red: 800,
				black: 900
			}, this.modes[mode].densities || {}),
			spaceco: Object.assign({
				damage: 0,
				partCount: [13, 21],
				resourceBay: {},
				services: {},
				fuel: {},
				shop: {}
			}, this.modes[mode].spaceco || {}, this.worlds[worldPack].spaceco || {})
		};

		if(world.width instanceof Array) world.width = util.randInt.apply(null, world.width);
		if(world.depth instanceof Array) world.depth = util.randInt.apply(null, world.depth);
		if(world.gravity instanceof Array) world.gravity = util.randInt.apply(null, world.gravity);

		if(!world.spaceco.position) world.spaceco.position = { x: util.randInt(3, world.width - 3), y: options.airGap };

		if(!world.spaceco.parts){
			world.spaceco.parts = {};

			if(world.spaceco.partCount instanceof Array) world.spaceco.partCount = util.randInt.apply(null, world.spaceco.partCount);

			for(let x = 0; x < world.spaceco.partCount; ++x){
				const { name, price } = phaserload.generatePart();

				world.spaceco.parts[name] = price;
			}
		}

		let holeChance, mineralChance, itemChance, hazardChance, depthPercent, layer, groundType, item, hazard;

		for(let x = 0, y; x < world.width; ++x){
			for(y = 0; y < world.depth; ++y){//todo make y based modifications account for depth and be configurable if possible (maybe with a bezier curve?)
				depthPercent = y / world.depth;
				layer = options.layers[Math.floor(depthPercent * options.layers.length)];

				// log()('layer', layer, y, depthPercent, Math.floor(depthPercent * options.layers.length));

				holeChance = layer.holeChance || (depthPercent * options.holeChance);
				mineralChance = layer.mineralChance || (depthPercent * options.mineralChance);
				// itemChance = layer.itemChance || (depthPercent * options.itemChance);
				// hazardChance = layer.hazardChance || (depthPercent * options.hazardChance);

				if(!world.map[x]) world.map[x] = [];

				world.map[x][y] = {
					ground: {},
					// items: [],
					// mobs: []
				};

				if(y <= options.airGap) continue;

				groundType = typeof layer.ground === 'object' ? (layer.ground instanceof Array ? util.randFromArr(layer.ground) : util.weightedChance(layer.ground)) : layer.ground;

				if(groundType === 'random') groundType = util.randFromArr(phaserload.options.mineralColors);

				if(y < options.safeDepth || !util.chance(holeChance)){
					world.map[x][y].ground.type = groundType;

					if(util.chance(mineralChance)) world.map[x][y].ground.mineral = true;
				}

				// else {
				// 	if(util.chance(hazardChance)){
				// 		hazard = typeof hazard === 'object' ? (hazard instanceof Array ? util.randFromArr(hazard) : util.weightedChance(hazard)) : hazard;

				// 		if(hazard === 'random') hazard = util.randFromArr(['red_monster', 'purple_monster', 'poisonous_gas', 'noxious_gas', 'lava', 'water']);
				// 		else if(hazard === 'fluid') hazard = util.chance() ? 'water' : 'lava';
				// 		else if(hazard === 'gas') hazard = util.chance() ? 'poisonous_gas' : 'noxious_gas';
				// 		else if(hazard === 'monster') hazard = util.chance() ? 'red_monster' : 'purple_monster';

				// 		world.map[x][y].mobs.push({ name: hazard });
				// 	}

				// 	else {
				// 		// if(util.chance(mineralChance)) world.map[x][y].items.push({ name: `mineral_${color}` });

				// 		// if(util.chance(itemChance)){
				// 		// 	item = typeof item === 'object' ? (item instanceof Array ? util.randFromArr(item) : util.weightedChance(item)) : item;

				// 		// 	if(item === 'random') item = util.randFromArr(phaserload.options.itemNames);

				// 		// 	world.map[x][y].items.push({ name: item });
				// 		// }
				// 	}
				// }
			}
		}

		return world;
	},
	generatePart: function(){
		var type = util.randFromArr(['tracks', 'hull', 'drill', 'fuel_tank']);
		var material = util.weightedChance({ tritanium: 20, duranium: 18, pentrilium: 16, byzanium: 14, etherium: 12, mithril: 8, octanium: 5, saronite: 4, adamantite: 1, quadium: 2 });
		var subTypes = {
			tracks: { boosted_1: 40, boosted_2: 30, boosted_3: 20, antigravidic: 10 },
			hull: { large: 70, oversized: 30 },
			drill: { quadratic: 50, precision_1: 30, precision_2: 20 },
			fuel_tank: { large: 30, oversized: 20, pressurized: 25, battery: 15, condenser: 10 }
		};
		var subType = util.weightedChance(subTypes[type]);

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
	},
	getImmediateSurrounds: function(map, pos, directionMap){
		if(!directionMap) directionMap = { left: 1, right: 1, farLeft: 1, farRight: 1, top: 1, topLeft: 1, topRight: 1, bottom: 1, bottomLeft: 1, bottomRight: 1 };

		Object.keys(directionMap).forEach((direction) => {
			let xMod = 0, yMod = 0;

			if({ left: 1, topLeft: 1, bottomLeft: 1, farLeft: 1 }[direction]) --xMod;
			if({ right: 1, topRight: 1, bottomRight: 1, farRight: 1 }[direction]) ++xMod;
			if({ farLeft: 1 }[direction]) --xMod;
			if({ farRight: 1 }[direction]) ++xMod;
			if({ top: 1, topLeft: 1, topRight: 1 }[direction]) --yMod;
			if({ bottom: 1, bottomLeft: 1, bottomRight: 1 }[direction]) ++yMod;

			const x = pos.x + xMod, y = pos.y + yMod;

			directionMap[direction] = { x, y, ...phaserload.mapPos(map, x, y).ground };
		});

		return directionMap;
	},
	getSurroundingRadiusPositions: function(pos, radius){
		const x_from = pos.x - radius, x_to = pos.x + radius;
		const y_from = pos.y - radius, y_to = pos.y + radius;
		let surroundingRadius = [];

		for(let x = x_from, y; x <= x_to; ++x) for(y = y_from; y <= y_to; ++y) surroundingRadius.push({ x: x, y: y });

		return surroundingRadius;
	},
	mapPos: function(map, x, y){
		if(typeof x === 'object'){
			y = x.y;
			x = x.x;
		}

		return map[x] !== undefined ? (map[x][y] !== undefined ? map[x][y] : map[0][0]) : map[0][0];
	},
	spacecoAt: function({ position }, { x, y }){
		return position.y === y && (position.x === x || position.x === x - 1 || position.x === x + 1);
	},
	playersAt: function(map, pos){

	},
	checkMobFall: function(map, pos){
		const surrounds = phaserload.getImmediateSurrounds(map, pos, { bottomLeft: 1, bottom: 1, bottomRight: 1 });
		let fall = true;

		log('test', pos, surrounds);

		if(surrounds.bottomLeft.type || surrounds.bottom.type || surrounds.bottomRight.type) fall = false;

		log(1)('checkMobFall', fall, pos.y);

		if(fall) return phaserload.checkMobFall(map, { x: pos.x, y: pos.y + 1 });

		return pos.y;
	}
};