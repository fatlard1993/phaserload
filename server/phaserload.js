const path = require('path');

const { Log } = require('log');
const { jsUtil } = require('js-util');
const fsExtended = require('fs-extended');
const express = require('express');

const log = new Log({ tag: 'phaserload' });

const { port } = require('../constants.json');

const phaserload = (module.exports = {
	rootPath: function () {
		return path.join(__dirname, '..', ...arguments);
	},
	options: {
		// todo make these options configurable
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
			black: 'quadium',
		},
		mineralColors: ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'],
		items: {
			teleporter: {
				useEffects: ['teleport:~:spaceco'],
			},
			responder_teleporter: {
				useEffects: ['teleport:~:responder'],
			},
			repair_nanites: {
				useEffects: ['heal'],
				interactEffects: ['repair:~:95:~:25'],
			},
			timed_charge: {
				useEffects: ['explode:~:3'],
				interactEffects: ['intractable:~:disarm'],
			},
			remote_charge: {
				useEffects: ['explode:~:5'],
				interactEffects: ['intractable:~:disarm'],
			},
			timed_freeze_charge: {
				useEffects: ['freeze:~:3'],
				interactEffects: ['intractable:~:disarm'],
			},
			remote_freeze_charge: {
				useEffects: ['freeze:~:5'],
				interactEffects: ['intractable:~:disarm'],
			},
			tombstone: {
				interactEffects: ['intractable:~:tombstone'],
			},
			satchel: {
				interactEffects: ['intractable:~:satchel'],
			},
		},
	},
	init: function (options) {
		this.options = Object.assign(this.options, options);

		require('./debugPrompt');

		this.app = express();
		this.server = this.app.listen(port, () => log(`Server listening on port: ${port}`));

		require('./router');

		this.socketServer = new (require('./socketServer'))(this.server);

		this.loadDataPack('modes');
		this.loadDataPack('worlds');
	},
	loadDataPack: function (name, done) {
		//todo add parts datapacks

		const packPath = this.rootPath(name);

		this[name] = this[name] = {};

		fsExtended.browse(packPath, data => {
			log(`Importing ${data.files.length} packs from ${packPath}`);

			data.files.forEach(file => {
				try {
					var packData = JSON.parse(fsExtended.catSync(file));
				} catch (err) {
					return log.error(`Error parsing pack ${file}`, err);
				}

				const packName = file.replace(new RegExp(packPath + '/'), '').replace('.json', '');

				this[name][packName] = packData;

				log(`Loaded "${packName}"`);
			});

			if (done) done();
		});
	},
	generateWorld: function (mode, worldPack, worldIndex) {
		log()('generateWorld', mode, worldPack, worldIndex);

		phaserload.options.itemNames = Object.keys(phaserload.options.items);

		if (worldIndex === 'rand') worldIndex = jsUtil.randInt(0, this.worlds[worldPack].length - 1);

		const options = Object.assign(
			{
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
				layers: [{ ground: 'random' }],
			},
			this.worlds[worldPack][worldIndex],
		);

		if (options.airGap instanceof Array) options.airGap = jsUtil.randInt.apply(null, options.airGap);
		if (options.safeDepth instanceof Array) options.safeDepth = jsUtil.randInt.apply(null, options.safeDepth);

		log()('options', options);

		const world = {
			pack: worldPack,
			airGap: options.airGap,
			map: [],
			width: options.width || [30, 50],
			depth: options.depth || [180, 250],
			gravity: options.gravity || [350, 500],
			groundEffects: Object.assign(
				{
					white: ['bonus:~:2:~:white:~:[1,2]'],
					orange: ['bonus:~:2:~:orange:~:[1,2]'],
					yellow: ['bonus:~:2:~:yellow:~:[1,2]'],
					green: ['poisonous_gas:~:12'],
					teal: ['teleporting:~:5'],
					blue: ['freezing:~:15'],
					purple: ['noxious_gas:~:12'],
					pink: ['bonus:~:10:~:pink:~:1', 'exploding:~:10'],
					red: ['bonus:~:2:~:red:~:[1,2]', 'lava:~:35', 'exploding:~:5'],
					black: ['impenetrable'],
				},
				this.modes[mode].groundEffects || {},
			),
			densities: Object.assign(
				{
					white: 400,
					orange: 500,
					yellow: 560,
					green: 620,
					teal: 700,
					blue: 740,
					purple: 760,
					pink: 780,
					red: 800,
					black: 900,
				},
				this.modes[mode].densities || {},
			),
			spaceco: Object.assign(
				{
					damage: 0,
					partCount: [13, 21],
					resourceBay: {},
					services: {},
					fuel: {},
					shop: {},
				},
				this.modes[mode].spaceco || {},
				this.worlds[worldPack].spaceco || {},
			),
		};

		if (world.width instanceof Array) world.width = jsUtil.randInt.apply(null, world.width);
		if (world.depth instanceof Array) world.depth = jsUtil.randInt.apply(null, world.depth);
		if (world.gravity instanceof Array) world.gravity = jsUtil.randInt.apply(null, world.gravity);

		if (!world.spaceco.position) world.spaceco.position = { x: jsUtil.randInt(3, world.width - 3), y: options.airGap };

		if (!world.spaceco.parts) {
			world.spaceco.parts = {};

			if (world.spaceco.partCount instanceof Array) world.spaceco.partCount = jsUtil.randInt.apply(null, world.spaceco.partCount);

			for (let x = 0; x < world.spaceco.partCount; ++x) {
				const { name, price } = phaserload.generatePart();

				world.spaceco.parts[name] = price;
			}
		}

		let holeChance, mineralChance, depthPercent, layer, groundType; //, itemChance, hazardChance, item, hazard;

		for (let x = 0, y; x < world.width; ++x) {
			for (y = 0; y < world.depth; ++y) {
				//todo make y based modifications account for depth and be configurable if possible (maybe with a bezier curve?)
				depthPercent = y / world.depth;
				layer = options.layers[Math.floor(depthPercent * options.layers.length)];

				// log()('layer', layer, y, depthPercent, Math.floor(depthPercent * options.layers.length));

				holeChance = layer.holeChance || depthPercent * options.holeChance;
				mineralChance = layer.mineralChance || depthPercent * options.mineralChance;
				// itemChance = layer.itemChance || (depthPercent * options.itemChance);
				// hazardChance = layer.hazardChance || (depthPercent * options.hazardChance);

				if (!world.map[x]) world.map[x] = [];

				world.map[x][y] = {
					ground: {},
					// items: [],
					// mobs: []
				};

				if (y <= options.airGap) continue;

				groundType = typeof layer.ground === 'object' ? (layer.ground instanceof Array ? jsUtil.randFromArr(layer.ground) : jsUtil.weightedChance(layer.ground)) : layer.ground;

				if (groundType === 'random') groundType = jsUtil.randFromArr(phaserload.options.mineralColors);

				if (y < options.safeDepth || !jsUtil.chance(holeChance)) {
					world.map[x][y].ground.type = groundType;

					if (jsUtil.chance(mineralChance)) world.map[x][y].ground.mineral = true;
				}

				// else {
				// 	if(jsUtil.chance(hazardChance)){
				// 		hazard = typeof hazard === 'object' ? (hazard instanceof Array ? jsUtil.randFromArr(hazard) : jsUtil.weightedChance(hazard)) : hazard;

				// 		if(hazard === 'random') hazard = jsUtil.randFromArr(['red_monster', 'purple_monster', 'poisonous_gas', 'noxious_gas', 'lava', 'water']);
				// 		else if(hazard === 'fluid') hazard = jsUtil.chance() ? 'water' : 'lava';
				// 		else if(hazard === 'gas') hazard = jsUtil.chance() ? 'poisonous_gas' : 'noxious_gas';
				// 		else if(hazard === 'monster') hazard = jsUtil.chance() ? 'red_monster' : 'purple_monster';

				// 		world.map[x][y].mobs.push({ name: hazard });
				// 	}

				// 	else {
				// 		// if(jsUtil.chance(mineralChance)) world.map[x][y].items.push({ name: `mineral_${color}` });

				// 		// if(jsUtil.chance(itemChance)){
				// 		// 	item = typeof item === 'object' ? (item instanceof Array ? jsUtil.randFromArr(item) : jsUtil.weightedChance(item)) : item;

				// 		// 	if(item === 'random') item = jsUtil.randFromArr(phaserload.options.itemNames);

				// 		// 	world.map[x][y].items.push({ name: item });
				// 		// }
				// 	}
				// }
			}
		}

		return world;
	},
	generatePart: function () {
		var type = jsUtil.randFromArr(['tracks', 'hull', 'cargoBay', 'drill', 'fuelTank']);
		var material = jsUtil.weightedChance({ tritanium: 20, duranium: 18, pentrilium: 16, byzanium: 14, etherium: 12, mithril: 8, octanium: 5, saronite: 4, adamantite: 1, quadium: 2 });
		var subTypes = {
			tracks: { boosted_1: 40, boosted_2: 30, boosted_3: 20, antigravidic: 10 },
			hull: { enhanced: 70, reinforced: 30 },
			cargoBay: { large: 70, oversized: 30 },
			drill: { quadratic: 50, precision_1: 30, precision_2: 20 },
			fuelTank: { large: 30, oversized: 20, pressurized: 25, battery: 15, condenser: 10 },
		};
		var subType = jsUtil.weightedChance(subTypes[type]);

		var typePrice = { tracks: 10, hull: 10, drill: 10, fuelTank: 10 };
		var materialPrice = { tritanium: 10, duranium: 15, pentrilium: 25, byzanium: 30, etherium: 40, mithril: 45, octanium: 50, saronite: 55, adamantite: 65, quadium: 80 };
		var subtypePrices = {
			tracks: { boosted_1: 20, boosted_2: 30, boosted_3: 40, antigravidic: 50 },
			hull: { enhanced: 20, reinforced: 40 },
			cargoBay: { large: 20, oversized: 40 },
			drill: { quadratic: 20, precision_1: 30, precision_2: 50 },
			fuelTank: { large: 20, oversized: 30, pressurized: 40, battery: 55, condenser: 70 },
		};

		var partName = subType + ':~:' + material + ':~:' + type;
		var partPrice = subtypePrices[type][subType] + materialPrice[material] + typePrice[type];

		return { name: partName, price: partPrice };
	},
	getImmediateSurrounds: function (map, pos, directionMap) {
		if (!directionMap) directionMap = { left: 1, right: 1, farLeft: 1, farRight: 1, top: 1, topLeft: 1, topRight: 1, bottom: 1, bottomLeft: 1, bottomRight: 1 };

		Object.keys(directionMap).forEach(direction => {
			let xMod = 0,
				yMod = 0;

			if ({ left: 1, topLeft: 1, bottomLeft: 1, farLeft: 1 }[direction]) --xMod;
			if ({ right: 1, topRight: 1, bottomRight: 1, farRight: 1 }[direction]) ++xMod;
			if ({ farLeft: 1 }[direction]) --xMod;
			if ({ farRight: 1 }[direction]) ++xMod;
			if ({ top: 1, topLeft: 1, topRight: 1 }[direction]) --yMod;
			if ({ bottom: 1, bottomLeft: 1, bottomRight: 1 }[direction]) ++yMod;

			const x = pos.x + xMod,
				y = pos.y + yMod;

			directionMap[direction] = { x, y, ...phaserload.mapPos(map, x, y).ground };
		});

		return directionMap;
	},
	getSurroundingRadiusPositions: function (pos, radius) {
		const x_from = pos.x - radius,
			x_to = pos.x + radius;
		const y_from = pos.y - radius,
			y_to = pos.y + radius;
		const surroundingRadius = [];

		for (let x = x_from, y; x <= x_to; ++x) for (y = y_from; y <= y_to; ++y) surroundingRadius.push({ x: x, y: y });

		return surroundingRadius;
	},
	mapPos: function (map, x, y) {
		if (typeof x === 'object') {
			y = x.y;
			x = x.x;
		}

		return map[x] !== undefined ? (map[x][y] !== undefined ? map[x][y] : map[0][0]) : map[0][0];
	},
	spacecoAt: function ({ position }, { x, y }) {
		return position.y === y && (position.x === x || position.x === x - 1 || position.x === x + 1);
	},
	playersAt: function (map, pos) {
		log('phaserload.playersAt is not-yet-implemented', map, pos);
	},
	checkMobFall: function (map, pos) {
		const surrounds = phaserload.getImmediateSurrounds(map, pos, { bottomLeft: 1, bottom: 1, bottomRight: 1 });
		let fall = true;

		if (surrounds.bottomLeft.type || surrounds.bottom.type || surrounds.bottomRight.type) fall = false;

		log(1)('checkMobFall', fall, pos.y);

		if (fall) return phaserload.checkMobFall(map, { x: pos.x, y: pos.y + 1 });

		return pos.y;
	},
	getMineralConsumption: function (mineral, world) {
		const type = mineral.split('_');

		return world.densities[type[1]] * (type[0] === 'pure' ? 0.00015 : 0.00028);
	},
	getMineralPrice: function (mineral, world) {
		const type = mineral.split('_');

		return world.densities[type[1]] * (type[0] === 'pure' ? 0.15 : 0.05);
	},
});

// effects: {
// 	explode: function(pos, radius){
// 		var distanceFromPlayer = phaserload.phaser.math.distance(pos.x, pos.y, phaserload.toGridPos(phaserload.player.sprite.x), phaserload.toGridPos(phaserload.player.sprite.y));

// 		var intensity = Math.max(1, (radius * 2) + (radius - distanceFromPlayer));
// 		phaserload.phaser.camera.shake(intensity / 1000, 1000);

// 		if(!phaserload.player.isDisoriented && distanceFromPlayer < 10) phaserload.phaser.camera.flash(undefined, 1000, 1, 0.3);

// 		socketClient.reply('explosion', { pos: pos, radius: radius });

// 		if(phaserload.phaser.math.distance(pos.x, pos.y, phaserload.toGridPos(phaserload.spaceco.sprite.x), phaserload.toGridPos(phaserload.spaceco.sprite.y)) < phaserload.blockPx * (radius + 1)){
// 			phaserload.spaceco.hurt((radius + 1) - (phaserload.phaser.math.distance(pos.x, pos.y, phaserload.toGridPos(phaserload.spaceco.sprite.x), phaserload.toGridPos(phaserload.spaceco.sprite.y)) / phaserload.blockPx), 'an explosion');
// 		}

// 		if(distanceFromPlayer < radius){
// 			phaserload.effects.hurt('explosion', jsUtil.rand(radius, radius * 2) * (radius - distanceFromPlayer), 3);
// 		}

// 		var surroundingGround = phaserload.getSurroundingRadius(pos, radius);

// 		surroundingGround.forEach(function(pos){
// 			phaserload.setMapPos(pos);
// 		});
// 	},
// 	freeze: function(pos, radius){
// 		if(!phaserload.player.isDisoriented) phaserload.phaser.camera.flash(undefined, 1000, 1, 0.1);

// 		var surroundingGround = phaserload.getSurroundingRadius(pos, radius);

// 		surroundingGround.forEach(function(pos){
// 			var ground = phaserload.mapPos(pos).ground;

// 			if(ground.name === 'lava') phaserload.setMapPos(pos, 'ground_'+ jsUtil.weightedChance({ white: 90, red: 10 }));
// 		});
// 	},
// 	exploding: function(chance, pos){
// 		if(jsUtil.chance(chance)) phaserload.effects.explode(pos, jsUtil.randInt(2, 3));
// 	},
// 	freezing: function(chance, pos){
// 		if(jsUtil.chance(chance)) phaserload.effects.freeze(pos, jsUtil.randInt(2, 4));
// 	},
// 	teleporting: function(chance){
// 		if(jsUtil.chance(chance)){
// 			var pos = jsUtil.randFromArr(phaserload.findGround('ground_teal'));//todo use dynamic ground name

// 			if(pos) phaserload.effects.teleport(pos);
// 		}
// 	},
// 	bonus: function(chance, color, count){
// 		if(jsUtil.chance(chance)){
// 			if(color === 'rand') color = jsUtil.randFromArr(phaserload.mineralColors);

// 			phaserload.effects.getHullItem('mineral_'+ color, typeof count === 'number' ? count : (typeof count === 'object' ? jsUtil.randInt.apply(null, count) : 1));
// 		}
// 	},
// 	lava: function(chance, pos){
// 		if(jsUtil.chance(chance)) phaserload.setMapPos(pos, 'lava', 'fill');
// 	},
// 	poisonous_gas: function(chance, pos){
// 		if(jsUtil.chance(chance)) phaserload.setMapPos(pos, 'poisonous_gas', 'fill');
// 	},
// 	noxious_gas: function(chance, pos){
// 		if(jsUtil.chance(chance)) phaserload.setMapPos(pos, 'noxious_gas', 'fill');
// 	},
// 	lavaRelease: function(){
// 		for(var x = 0; x < phaserload.config.width; ++x){
// 			for(var y = phaserload.config.depth - phaserload.toGridPos(phaserload.viewHeight); y < phaserload.config.depth; ++y){
// 				if(jsUtil.chance(90) && phaserload.mapPos(x, y).ground.name === 'ground_red'){
// 					phaserload.setMapPos({ x: x, y: y }, 'lava', 'fill');
// 				}
// 			}
// 		}
// 	},
// 	repair: function(chance, variation){
// 		if(!jsUtil.chance(chance)) return;

// 		phaserload.player.health = phaserload.effects.heal(phaserload.player.max_health, variation);
// 	},
// 	disorient: function(duration){
// 		if(phaserload.player.isDisoriented) clearTimeout(phaserload.player.isDisoriented_TO);

// 		else{
// 			phaserload.phaser.camera.fade(undefined, duration, 1, 0.5);
// 		}

// 		phaserload.phaser.camera.shake(0.001, duration);

// 		phaserload.player.isDisoriented = true;
// 		phaserload.player.isDisoriented_TO = setTimeout(function(){
// 			phaserload.player.isDisoriented = false;

// 			phaserload.phaser.camera.flash(undefined, 1000, 1, 0.2);
// 		}, duration);
// 	},
// 	heal: function(amount, variation){
// 		amount = amount || phaserload.player.max_health;

// 		phaserload.player.health = Math.min(phaserload.player.max_health, phaserload.player.health + (variation ? jsUtil.rand(amount - variation, amount + variation) : amount));

// 		phaserload.hud.update();
// 	},
// 	hurt: function(by, amount, variation){
// 		if(phaserload.player.justHurt) return; //todo make this depend on what the damage is from

// 		phaserload.player.justHurt = true;
// 		phaserload.player.justHurt_TO = setTimeout(function(){ phaserload.player.justHurt = false; }, 800);

// 		phaserload.player.health = Math.max(0, phaserload.player.health - (variation ? jsUtil.rand(amount - variation, amount + variation) : amount));

// 		if(phaserload.player.health <= 0) phaserload.player.kill(by);

// 		else if(phaserload.player.health <= 25){
// 			phaserload.notify('Your health is\nrunning low', 1.5);
// 		}

// 		else phaserload.hud.update();
// 	},
// 	refuel: function(amount, variation){
// 		phaserload.player.fuel = Math.min(phaserload.player.max_fuel, phaserload.player.fuel + (variation ? jsUtil.rand(amount - variation, amount + variation) : amount));
// 	},
// 	useFuel: function(amount, variation){
// 		phaserload.player.fuel = Math.max(0, phaserload.player.fuel - (variation ? jsUtil.rand(amount - variation, amount + variation) : amount));

// 		if(phaserload.player.fuel <= 0) phaserload.player.kill('fuel');

// 		else if(phaserload.player.fuel <= 1){
// 			phaserload.notify('Your fuel is\nrunning low', 1.5);
// 		}

// 		else phaserload.hud.update();
// 	},
// 	getInvItem: function(itemName, count){
// 		phaserload.player.inventory[itemName] = phaserload.player.inventory[itemName] !== undefined ? phaserload.player.inventory[itemName] : 0;

// 		phaserload.player.inventory[itemName] += count || 1;
// 	},
// 	loseInvItem: function(itemName, count){
// 		if(!phaserload.player.inventory[itemName]) return;

// 		phaserload.player.inventory[itemName] -= count || 1;

// 		if(phaserload.player.inventory[itemName] < 1) delete phaserload.player.inventory[itemName];
// 	},
// 	getHullItem: function(itemName, count){
// 		count = count || 1;

// 		var weight, isMineral = itemName.startsWith('mineral');
// 		var densityMod = phaserload.state.densities[itemName.replace('mineral_', '').replace('ground_', '')] * 0.0001;

// 		if(isMineral) weight = densityMod;
// 		else weight = 0.07 + densityMod;

// 		if(phaserload.player.hull.space < (weight * count)) return false;

// 		phaserload.player.hull.space -= (weight * count);

// 		phaserload.player.hull[itemName] = phaserload.player.hull[itemName] !== undefined ? phaserload.player.hull[itemName] : 0;

// 		phaserload.player.hull[itemName] += count;

// 		return true;
// 	},
// 	teleport: function(pos){
// 		var teleportPos;

// 		phaserload.player.sprite.animations.play('teleporting');

// 		if(pos === 'spaceco'){
// 			teleportPos = phaserload.toGridPos(phaserload.spaceco.sprite);
// 		}

// 		else if(pos === 'responder'){
// 			teleportPos = phaserload.toGridPos(phaserload.player.responder);
// 		}

// 		else if(typeof pos === 'object'){
// 			teleportPos = pos;
// 		}

// 		phaserload.player.move('teleport', null, teleportPos);
// 	},
// 	intractable: function(){
// 		//todo notify and provide a custom interaction screen for things like bomb disarm, loot drop, responder disarm
// 	},
// 	collect: function(item){
// 		if(item.name.startsWith('mineral_')){
// 			var gotIt = phaserload.effects.getHullItem(item.name);

// 			if(!gotIt) return;
// 		}

// 		var animationTime = 200 + Math.ceil(phaserload.phaser.math.distance(phaserload.phaser.camera.x, phaserload.phaser.camera.y, item.sprite.x, item.sprite.y));

// 		phaserload.phaser.add.tween(item.sprite).to({ x: phaserload.phaser.camera.x, y: phaserload.phaser.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);

// 		setTimeout(item.sprite.kill, animationTime);

// 	},
// 	dropItem: function(itemName, pos){
// 		console.log(`todo create ${itemName} at ${pos}`);
// 	}
// },
// applyEffects: function(effects, pos){
// 	pos = pos && pos.x && pos.y ? pos : phaserload.toGridPos(phaserload.player.sprite);

// 	for(var x = 0; x < effects.length; ++x){
// 		var params = effects[x].split(':~:'), effect = params.shift();

// 		if({ poisonous_gas: 1, noxious_gas: 1, lava: 1, exploding: 1, freezing: 1, dropItem: 1 }[effect]) params[1] = pos;

// 		else if({ bonus: 1 }[effect]) params[3] = JSON.parse(params[2]);

// 		else if({ collect: 1 }[effect]) params[0] = arguments[2];

// 		phaserload.effects[effect].apply(null, params);
// 	}
// },
// achievements: {
// 	depth10: {
// 		text: 'Congratulations\nyouve made it to\nlevel 10',
// 		effects: ['bonus:~:100:~:rand:~:[1,3]']
// 	},
// 	depth50: {
// 		text: 'Congratulations\nyouve made it to\nlevel 50',
// 		effects: ['bonus:~:100:~:rand:~:[5,7]']
// 	},
// 	depth100: {
// 		text: 'Congratulations\nyouve made it to\nlevel 100',
// 		effects: ['bonus:~:100:~:rand:~:[7,9]']
// 	},
// 	depth200: {
// 		text: 'Congratulations\nyouve made it to\nlevel 200',
// 		effects: ['bonus:~:100:~:rand:~:[9,13]']
// 	}
// },
// getAchievement: function(name){
// 	if(phaserload.achievements[name].achieved) return;
// 	phaserload.achievements[name].achieved = true;

// 	phaserload.notify(phaserload.achievements[name].text);

// 	phaserload.applyEffects(phaserload.achievements[name].effects);
// },
