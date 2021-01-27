import log from '../logger';
import lang from '../lang/index';

import util from 'js-util';
import socketClient from 'socket-client';
import Phaser from './node_modules/phaser/dist/phaser.min.js';

var phaserload = {
	blockPx: 64,
	config: {
		backgroundColor: '#333',
		font: 'monospace',
		textColor: '#227660',
		hudTextColor: '#94B133'
	},
	helpText: [
		'tap and hold/drag',
		'up, left, down, right',
		'w, a, s, d',
		'esc to open hud',
		'1, and 2 to use the item slots'
	],
	mineralColors: ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'],
	player: {},
	players: {},
	states: {},
	entities: {},
	effects: {
		explode: function(pos, radius){
			var distanceFromPlayer = phaserload.phaser.math.distance(pos.x, pos.y, phaserload.toGridPos(phaserload.player.sprite.x), phaserload.toGridPos(phaserload.player.sprite.y));

			var intensity = Math.max(1, (radius * 2) + (radius - distanceFromPlayer));
			phaserload.phaser.camera.shake(intensity / 1000, 1000);

			if(!phaserload.player.isDisoriented && distanceFromPlayer < 10) phaserload.phaser.camera.flash(undefined, 1000, 1, 0.3);

			socketClient.reply('explosion', { pos: pos, radius: radius });

			if(phaserload.phaser.math.distance(pos.x, pos.y, phaserload.toGridPos(phaserload.spaceco.sprite.x), phaserload.toGridPos(phaserload.spaceco.sprite.y)) < phaserload.blockPx * (radius + 1)){
				phaserload.spaceco.hurt((radius + 1) - (phaserload.phaser.math.distance(pos.x, pos.y, phaserload.toGridPos(phaserload.spaceco.sprite.x), phaserload.toGridPos(phaserload.spaceco.sprite.y)) / phaserload.blockPx), 'an explosion');
			}

			if(distanceFromPlayer < radius){
				phaserload.effects.hurt('explosion', util.rand(radius, radius * 2) * (radius - distanceFromPlayer), 3);
			}

			var surroundingGround = phaserload.getSurroundingRadius(pos, radius);

			surroundingGround.forEach(function(pos){
				phaserload.setMapPos(pos);
			});
		},
		freeze: function(pos, radius){
			if(!phaserload.player.isDisoriented) phaserload.phaser.camera.flash(undefined, 1000, 1, 0.1);

			var surroundingGround = phaserload.getSurroundingRadius(pos, radius);

			surroundingGround.forEach(function(pos){
				var ground = phaserload.mapPos(pos).ground;

				if(ground.name === 'lava') phaserload.setMapPos(pos, 'ground_'+ util.weightedChance({ white: 90, red: 10 }));
			});
		},
		exploding: function(chance, pos){
			if(util.chance(chance)) phaserload.effects.explode(pos, util.randInt(2, 3));
		},
		freezing: function(chance, pos){
			if(util.chance(chance)) phaserload.effects.freeze(pos, util.randInt(2, 4));
		},
		teleporting: function(chance){
			if(util.chance(chance)){
				var pos = util.randFromArr(phaserload.findGround('ground_teal'));//todo use dynamic ground name

				if(pos) phaserload.effects.teleport(pos);
			}
		},
		bonus: function(chance, color, count){
			if(util.chance(chance)){
				if(color === 'rand') color = util.randFromArr(phaserload.mineralColors);

				phaserload.effects.getHullItem('mineral_'+ color, typeof count === 'number' ? count : (typeof count === 'object' ? util.randInt.apply(null, count) : 1));
			}
		},
		lava: function(chance, pos){
			if(util.chance(chance)) phaserload.setMapPos(pos, 'lava', 'fill');
		},
		poisonous_gas: function(chance, pos){
			if(util.chance(chance)) phaserload.setMapPos(pos, 'poisonous_gas', 'fill');
		},
		noxious_gas: function(chance, pos){
			if(util.chance(chance)) phaserload.setMapPos(pos, 'noxious_gas', 'fill');
		},
		lavaRelease: function(){
			for(var x = 0; x < phaserload.config.width; ++x){
				for(var y = phaserload.config.depth - phaserload.toGridPos(phaserload.viewHeight); y < phaserload.config.depth; ++y){
					if(util.chance(90) && phaserload.mapPos(x, y).ground.name === 'ground_red'){
						phaserload.setMapPos({ x: x, y: y }, 'lava', 'fill');
					}
				}
			}
		},
		repair: function(chance, variation){
			if(!util.chance(chance)) return;

			phaserload.player.health = phaserload.effects.heal(phaserload.player.max_health, variation);
		},
		disorient: function(duration){
			if(phaserload.player.isDisoriented) clearTimeout(phaserload.player.isDisoriented_TO);

			else{
				phaserload.phaser.camera.fade(undefined, duration, 1, 0.5);
			}

			phaserload.phaser.camera.shake(0.001, duration);

			phaserload.player.isDisoriented = true;
			phaserload.player.isDisoriented_TO = setTimeout(function(){
				phaserload.player.isDisoriented = false;

				phaserload.phaser.camera.flash(undefined, 1000, 1, 0.2);
			}, duration);
		},
		heal: function(amount, variation){
			amount = amount || phaserload.player.max_health;

			phaserload.player.health = Math.min(phaserload.player.max_health, phaserload.player.health + (variation ? util.rand(amount - variation, amount + variation) : amount));

			phaserload.hud.update();
		},
		hurt: function(by, amount, variation){
			if(phaserload.player.justHurt) return; //todo make this depend on what the damage is from

			phaserload.player.justHurt = true;
			phaserload.player.justHurt_TO = setTimeout(function(){ phaserload.player.justHurt = false; }, 800);

			phaserload.player.health = Math.max(0, phaserload.player.health - (variation ? util.rand(amount - variation, amount + variation) : amount));

			if(phaserload.player.health <= 0) phaserload.player.kill(by);

			else if(phaserload.player.health <= 25){
				phaserload.notify('Your health is\nrunning low', 1.5);
			}

			else phaserload.hud.update();
		},
		refuel: function(amount, variation){
			phaserload.player.fuel = Math.min(phaserload.player.max_fuel, phaserload.player.fuel + (variation ? util.rand(amount - variation, amount + variation) : amount));
		},
		useFuel: function(amount, variation){
			phaserload.player.fuel = Math.max(0, phaserload.player.fuel - (variation ? util.rand(amount - variation, amount + variation) : amount));

			if(phaserload.player.fuel <= 0) phaserload.player.kill('fuel');

			else if(phaserload.player.fuel <= 1){
				phaserload.notify('Your fuel is\nrunning low', 1.5);
			}

			else phaserload.hud.update();
		},
		getInvItem: function(itemName, count){
			phaserload.player.inventory[itemName] = phaserload.player.inventory[itemName] !== undefined ? phaserload.player.inventory[itemName] : 0;

			phaserload.player.inventory[itemName] += count || 1;
		},
		loseInvItem: function(itemName, count){
			if(!phaserload.player.inventory[itemName]) return;

			phaserload.player.inventory[itemName] -= count || 1;

			if(phaserload.player.inventory[itemName] < 1) delete phaserload.player.inventory[itemName];
		},
		getHullItem: function(itemName, count){
			count = count || 1;

			var weight, isMineral = itemName.startsWith('mineral');
			var densityMod = phaserload.state.densities[itemName.replace('mineral_', '').replace('ground_', '')] * 0.0001;

			if(isMineral) weight = densityMod;
			else weight = 0.07 + densityMod;

			if(phaserload.player.hull.space < (weight * count)) return false;

			phaserload.player.hull.space -= (weight * count);

			phaserload.player.hull[itemName] = phaserload.player.hull[itemName] !== undefined ? phaserload.player.hull[itemName] : 0;

			phaserload.player.hull[itemName] += count;

			return true;
		},
		teleport: function(pos){
			var teleportPos;

			phaserload.player.sprite.animations.play('teleporting');

			if(pos === 'spaceco'){
				teleportPos = phaserload.toGridPos(phaserload.spaceco.sprite);
			}

			else if(pos === 'responder'){
				teleportPos = phaserload.toGridPos(phaserload.player.responder);
			}

			else if(typeof pos === 'object'){
				teleportPos = pos;
			}

			phaserload.player.move('teleport', null, teleportPos);
		},
		intractable: function(){
			//todo notify and provide a custom interaction screen for things like bomb disarm, loot drop, responder disarm
		},
		collect: function(item){
			if(item.name.startsWith('mineral_')){
				var gotIt = phaserload.effects.getHullItem(item.name);

				if(!gotIt) return;
			}

			var animationTime = 200 + Math.ceil(phaserload.phaser.math.distance(phaserload.phaser.camera.x, phaserload.phaser.camera.y, item.sprite.x, item.sprite.y));

			phaserload.phaser.add.tween(item.sprite).to({ x: phaserload.phaser.camera.x, y: phaserload.phaser.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);

			setTimeout(item.sprite.kill, animationTime);

		},
		dropItem: function(itemName, pos){
			//todo create item at pos
		}
	},
	applyEffects: function(effects, pos){
		pos = pos && pos.x && pos.y ? pos : phaserload.toGridPos(phaserload.player.sprite);

		for(var x = 0; x < effects.length; ++x){
			var params = effects[x].split(':~:'), effect = params.shift();

			if({ poisonous_gas: 1, noxious_gas: 1, lava: 1, exploding: 1, freezing: 1, dropItem: 1 }[effect]) params[1] = pos;

			else if({ bonus: 1 }[effect]) params[3] = JSON.parse(params[2]);

			else if({ collect: 1 }[effect]) params[0] = arguments[2];

			phaserload.effects[effect].apply(null, params);
		}
	},
	achievements: {
		depth10: {
			text: 'Congratulations\nyouve made it to\nlevel 10',
			effects: ['bonus:~:100:~:rand:~:[1,3]']
		},
		depth50: {
			text: 'Congratulations\nyouve made it to\nlevel 50',
			effects: ['bonus:~:100:~:rand:~:[5,7]']
		},
		depth100: {
			text: 'Congratulations\nyouve made it to\nlevel 100',
			effects: ['bonus:~:100:~:rand:~:[7,9]']
		},
		depth200: {
			text: 'Congratulations\nyouve made it to\nlevel 200',
			effects: ['bonus:~:100:~:rand:~:[9,13]']
		}
	},
	getAchievement: function(name){
		if(phaserload.achievements[name].achieved) return;
		phaserload.achievements[name].achieved = true;

		phaserload.notify(phaserload.achievements[name].text);

		phaserload.applyEffects(phaserload.achievements[name].effects);
	},
	normalizePosition: function(x, y){
		x = Math.floor(x / (phaserload.blockPx / 2)) * (phaserload.blockPx / 2);
		y = Math.floor(y / (phaserload.blockPx / 2)) * (phaserload.blockPx / 2);

		return { x: x, y: y };
	},
	notify: function(text, timeout){
		if(phaserload.notifyText === text) return;

		if(phaserload.notify_TO){
			clearTimeout(phaserload.notify_TO);

			phaserload.hud.statusText.setText('');

			phaserload.notifyText = '';
		}

		phaserload.phaser.add.tween(phaserload.hud.scale).to({ x: 1.2, y: 1.2 }, 400, Phaser.Easing.Back.Out, true);

		phaserload.hud.statusText.setText(text);

		phaserload.notifyText = text;

		setTimeout(function(){
			if(phaserload.hud.isOpen) return;

			phaserload.phaser.add.tween(phaserload.hud.scale).to({ x: 0.5, y: 0.5 }, 400, Phaser.Easing.Circular.Out, true);
		}, 350);

		phaserload.notify_TO = setTimeout(function(){
			phaserload.notify_TO = null;

			phaserload.notifyText = null;

			if(phaserload.hud.isOpen) return;

			phaserload.hud.update();
		}, (timeout || 3) * 1000);
	},
	updateMaxHealth: function(){
		var health = 0;
		var tracksPart = phaserload.player.configuration.tracks.split(':~:');
		var hullPart = phaserload.player.configuration.hull.split(':~:');
		var drillPart = phaserload.player.configuration.drill.split(':~:');
		var materialBonus = { tritanium: 30, duranium: 35, pentrilium: 40, byzanium: 45, etherium: 50, mithril: 60, octanium: 65, saronite: 70, adamantite: 75, quadium: 80 };

		health += materialBonus[tracksPart[1]];
		health += materialBonus[hullPart[1]];
		health += materialBonus[drillPart[1]];

		phaserload.player.max_health = health;

		phaserload.player.health = Math.min(health, phaserload.player.health);
	},
	updateMaxFuel: function(){
		var maxFuel = 5;
		var fuelTankPart = phaserload.player.configuration.fuel_tank.split(':~:');

		if(fuelTankPart[0] === 'large') maxFuel = 10;
		if(fuelTankPart[0] === 'oversized') maxFuel = 15;
		if(fuelTankPart[0] === 'pressurized') maxFuel = 20;
		if(fuelTankPart[0] === 'battery') maxFuel = 35;
		if(fuelTankPart[0] === 'condenser') maxFuel = 45;

		phaserload.player.max_fuel = maxFuel;

		phaserload.player.fuel = Math.min(maxFuel, phaserload.player.fuel);
	},
	updateBaseMoveTime: function(){
		var moveTime = 200;
		var tracksPart = phaserload.player.configuration.tracks.split(':~:');
		var hullPart = phaserload.player.configuration.hull.split(':~:');
		var drillPart = phaserload.player.configuration.drill.split(':~:');
		var materialSlowDown = { tritanium: 40, duranium: 45, pentrilium: 60, byzanium: 75, etherium: 90, mithril: 110, octanium: 125, saronite: 135, adamantite: 150, quadium: 180 };

		moveTime += materialSlowDown[tracksPart[1]];
		moveTime += materialSlowDown[hullPart[1]];
		moveTime += materialSlowDown[drillPart[1]];

		if(tracksPart[0].includes('boosted')) moveTime -= parseInt(tracksPart[0].split('_')[1]) * 120;

		phaserload.player.baseMoveTime = Math.max(200, moveTime);
	},
	updateMaxHullSpace: function(){
		var hullSpace = 10;
		var hullPart = phaserload.player.configuration.hull.split(':~:');

		if(hullPart[0] === 'large') hullSpace += 10;
		else if(hullPart[0] === 'oversized') hullSpace += 25;

		if(phaserload.player.hull.space !== undefined) phaserload.player.hull.space = hullSpace - (phaserload.player.max_hullSpace - phaserload.player.hull.space);
		else phaserload.player.hull.space = hullSpace;

		phaserload.player.max_hullSpace = hullSpace;
	},
	updateDrillSpeedMod: function(){
		var drillSpeedMod = 0;
		var drillPart = phaserload.player.configuration.drill.split(':~:');

		if(drillPart[0].includes('precision')) drillSpeedMod = parseInt(drillPart[0].split('_')[1]) * 30;
		if(drillPart[0] === 'quadratic') drillSpeedMod = 80;

		phaserload.player.drillSpeedMod = drillSpeedMod;
	},
	getSurrounds: function(pos, directionList, baseFilter){
		directionList = directionList || { left: 1, right: 1, farLeft: 1, farRight: 1, top: 1, topLeft: 1, topRight: 1, bottom: 1, bottomLeft: 1, bottomRight: 1 };

		var directions = Object.keys(directionList), count = directions.length, direction, xMod, yMod, ground;

		for(var x = 0; x < count; ++x){
			direction = directions[x];
			xMod = 0;
			yMod = 0;

			if({ left: 1, topLeft: 1, bottomLeft: 1, farLeft: 1 }[direction]) --xMod;
			if({ right: 1, topRight: 1, bottomRight: 1, farRight: 1 }[direction]) ++xMod;
			if({ farLeft: 1 }[direction]) --xMod;
			if({ farRight: 1 }[direction]) ++xMod;
			if({ top: 1, topLeft: 1, topRight: 1 }[direction]) --yMod;
			if({ bottom: 1, bottomLeft: 1, bottomRight: 1 }[direction]) ++yMod;

			ground = phaserload.mapPos(pos.x + xMod, pos.y + yMod).ground;

			directionList[direction] = baseFilter ? (baseFilter === ground.base ? ground.name : undefined) : ground.name;
		}

		return directionList;
	},
	getSurroundingRadius: function(pos, radius){
		var x_from = pos.x - radius, x_to = pos.x + radius;
		var y_from = pos.y - radius, y_to = pos.y + radius;
		var out = [];

		for(var x = x_from; x <= x_to; ++x){
			for(var y = y_from; y <= y_to; ++y){
				out.push({ x: x, y: y });
			}
		}

		return out;
	},
	mapPos: function(x, y){
		if(typeof x === 'object'){
			y = x.y;
			x = x.x;
		}

		return phaserload.config.map[x] !== undefined ? (phaserload.config.map[x][y] !== undefined ? phaserload.config.map[x][y] : phaserload.config.map[0][0]) : phaserload.config.map[0][0];
	},
	toGridPos: function(pos){
		if(typeof pos === 'object') pos = { x: Math.round((pos.x - 32) / 64), y: Math.round((pos.y - 32) / 64) };
		else pos = Math.round((pos - 32) / 64);

		return pos;
	},
	toPx: function(pos){
		if(typeof pos === 'object') pos = { x: (pos.x * 64) + 32, y: (pos.y * 64) + 32 };
		else pos = (pos * 64) + 32;

		return pos;
	},
	findGround: function(name){
		var found = [];

		for(var x = 0; x < phaserload.config.width; x++){
			for(var y = 0; y < phaserload.config.depth; y++){
				if(phaserload.mapPos(x, y).ground.name === name) found.push({ x: x, y: y });
			}
		}

		return found;
	},
	movePlayer: function(data){
		phaserload.phaser.add.tween(phaserload.players[data.player].sprite).to(data.position, data.moveTime, Phaser.Easing.Sinusoidal.InOut, true);

		phaserload.players[data.player].sprite.angle = data.angle;

		if(data.invertTexture) phaserload.players[data.player].sprite.scale.x = -phaserload.config.defaultPlayerScale;
		else phaserload.players[data.player].sprite.scale.x = phaserload.config.defaultPlayerScale;
	},
	setMapPos: function(pos, id, animation, fromServer){
		var oldGround = phaserload.mapPos(pos).ground, drawDelay = 0, drawVar;

		log()('setMapPos', pos, 'from', oldGround.name, 'to', id, animation ? 'playing '+ animation : '');

		if(id === undefined || (oldGround.sprite && oldGround.sprite.alive)){
			if(oldGround.base === 'ground'){
				drawDelay = phaserload.state.densities[oldGround.variant];

				oldGround.sprite.tween = phaserload.phaser.add.tween(oldGround.sprite).to({ alpha: 0 }, drawDelay, Phaser.Easing.Cubic.In, true);
				oldGround.sprite.animations.play('dig');
			}

			else if({ lava: 1, noxious_gas: 1, poisonous_gas: 1 }[oldGround.name]){
				oldGround.sprite.kill();
			}

			else if(oldGround.base === 'monster'){
				//
			}

			else if(oldGround.sprite) oldGround.sprite.destroy();
		}

		if({ noxious_gas: 1, poisonous_gas: 1 }[id]) drawVar = arguments[4] || 100;

		else if({ lava: 1 }[id]) drawVar = true;

		setTimeout(function(){
			if(id) phaserload.drawTile(pos.x, pos.y, id, animation, drawVar);

			else{
				oldGround.sprite = oldGround.base = oldGround.variant = oldGround.name = undefined;
			}
		}, drawDelay + 100);

		if(!fromServer) socketClient.reply('player_set_map_position', { pos: pos, id: id, animation: animation });
	},
	adjustViewPosition: function(newX, newY, time){
		// log()('adjustViewPosition');

		newX = Math.max(0, Math.min(phaserload.toPx(phaserload.config.width) - phaserload.viewWidth - 32, newX));

		phaserload.phaser.add.tween(phaserload.phaser.camera).to({ x: newX, y: newY }, time, Phaser.Easing.Sinusoidal.InOut, true);
	},
	drawMap: function(){
		log()('drawView');

		var top = 0;
		var left = 0;
		var bottom = phaserload.config.depth;
		var right = phaserload.config.width;

		log()('drawing '+ (((bottom - top) + 1) * ((right - left) + 1)) +' sprites, from: x'+ left +' y'+ top +' TO x'+ right +' y'+ bottom);

		var drawn = 0;

		for(var x = left; x <= right; x++){
			for(var y = top; y <= bottom; y++){
				var mapPos = phaserload.mapPos(x, y);

				if(mapPos.ground.name) phaserload.drawTile(x, y, mapPos.ground.name);

				if(mapPos.items.names[0]) phaserload.entities.item.create(x, y, mapPos.items.names.pop());

				drawn++;
			}
		}

		log()('drew: ', drawn);
	},
	drawTile: function(x, y, mapPos_0_name, animation){
		if(typeof mapPos_0_name !== 'string') return;

		var entity;

		if(mapPos_0_name.startsWith('ground')){
			entity = phaserload.entities.ground.create(x, y, mapPos_0_name);
		}

		else if(mapPos_0_name === 'lava'){
			entity = phaserload.entities.lava.create(x, y, !!animation);
		}

		else if(mapPos_0_name === 'poisonous_gas'){
			entity = phaserload.entities.poisonous_gas.create(x, y, animation ? (arguments[4] || 100) : undefined);
		}

		else if(mapPos_0_name === 'noxious_gas'){
			entity = phaserload.entities.noxious_gas.create(x, y, animation ? (arguments[4] || 100) : undefined);
		}

		else if(mapPos_0_name.endsWith('monster')){
			entity = phaserload.entities.monster.create(x, y, mapPos_0_name.replace('_monster', ''));
		}

		phaserload.config.map[x][y].ground.sprite = entity;

		if(animation) entity.animations.play(animation);
	},
	dev: function(){
		phaserload.player.credits = 999;

		phaserload.player.fuel = phaserload.player.max_fuel;
		phaserload.player.health = phaserload.player.max_health;

		phaserload.player.inventory = {
			'quadratic:~:tritanium:~:drill': 1,
			'precision_2:~:tritanium:~:drill': 1,
			'boosted_3:~:tritanium:~:tracks': 1,
			responder_teleporter: 99,
			timed_charge: 99,
			remote_charge: 99,
			timed_freeze_charge: 99,
			remote_freeze_charge: 99
		};

		phaserload.entities.itemSlot.setItem(1, 'responder_teleporter');
		phaserload.entities.itemSlot.setItem(2, 'timed_charge');
	}
};