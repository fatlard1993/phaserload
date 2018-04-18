/* global Phaser, Log, WS, Cjs */

var Game = {
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
			var distanceFromPlayer = Game.phaser.math.distance(pos.x, pos.y, Game.toGridPos(Game.player.sprite.x), Game.toGridPos(Game.player.sprite.y));

			var intensity = Math.max(1, (radius * 2) + (radius - distanceFromPlayer));
			Game.phaser.camera.shake(intensity / 1000, 1000);

			if(!Game.player.isDisoriented && distanceFromPlayer < 10) Game.phaser.camera.flash(undefined, 1000, 1, 0.3);

			WS.send({ command: 'explosion', pos: pos, radius: radius });

			if(Game.phaser.math.distance(pos.x, pos.y, Game.toGridPos(Game.spaceco.sprite.x), Game.toGridPos(Game.spaceco.sprite.y)) < Game.blockPx * (radius + 1)){
				Game.spaceco.hurt((radius + 1) - (Game.phaser.math.distance(pos.x, pos.y, Game.toGridPos(Game.spaceco.sprite.x), Game.toGridPos(Game.spaceco.sprite.y)) / Game.blockPx), 'an explosion');
			}

			if(distanceFromPlayer < radius){
				Game.effects.hurt('explosion', Cjs.rand(radius, radius * 2) * (radius - distanceFromPlayer), 3);
			}

			var surroundingGround = Game.getSurroundingRadius(pos, radius);

			surroundingGround.forEach(function(pos){
				Game.setMapPos(pos);
			});
		},
		freeze: function(pos, radius){
			if(!Game.player.isDisoriented) Game.phaser.camera.flash(undefined, 1000, 1, 0.1);

			var surroundingGround = Game.getSurroundingRadius(pos, radius);

			surroundingGround.forEach(function(pos){
				var ground = Game.mapPos(pos).ground;

				if(ground.name === 'lava') Game.setMapPos(pos, 'ground_'+ Cjs.weightedChance({ white: 90, red: 10 }));
			});
		},
		exploding: function(chance, pos){
			if(Cjs.chance(chance)) Game.effects.explode(pos, Cjs.randInt(2, 3));
		},
		freezing: function(chance, pos){
			if(Cjs.chance(chance)) Game.effects.freeze(pos, Cjs.randInt(2, 4));
		},
		teleporting: function(chance){
			if(Cjs.chance(chance)){
				var pos = Cjs.randFromArr(Game.findGround('ground_teal'));//todo use dynamic ground name

				if(pos) Game.effects.teleport(pos);
			}
		},
		bonus: function(chance, color, count){
			if(Cjs.chance(chance)){
				if(color === 'rand') color = Cjs.randFromArr(Game.mineralColors);

				Game.effects.getHullItem('mineral_'+ color, typeof count === 'number' ? count : (typeof count === 'object' ? Cjs.randInt.apply(null, count) : 1));
			}
		},
		lava: function(chance, pos){
			if(Cjs.chance(chance)) Game.setMapPos(pos, 'lava');
		},
		poisonous_gas: function(chance, pos){
			if(Cjs.chance(chance)) Game.setMapPos(pos, 'poisonous_gas', 'fill');
		},
		noxious_gas: function(chance, pos){
			if(Cjs.chance(chance)) Game.entities.noxious_gas.create(pos.x, pos.y, 100);
		},
		lavaRelease: function(){
			for(var x = 0; x < Game.config.width; ++x){
				for(var y = Game.config.depth - Game.toGridPos(Game.viewHeight); y < Game.config.depth; ++y){
					if(Cjs.chance(90) && Game.mapPos(x, y).ground.name === 'ground_red'){
						Game.setMapPos({ x: x, y: y }, 'lava');
					}
				}
			}
		},
		repair: function(chance, variation){
			if(!Cjs.chance(chance)) return;

			Game.player.health = Game.effects.heal(Game.player.max_health, variation);
		},
		disorient: function(duration){
			if(Game.player.isDisoriented) clearTimeout(Game.player.isDisoriented_TO);

			else{
				Game.phaser.camera.fade(undefined, duration, 1, 0.5);
			}

			Game.phaser.camera.shake(0.001, duration);

			Game.player.isDisoriented = true;
			Game.player.isDisoriented_TO = setTimeout(function(){
				Game.player.isDisoriented = false;

				Game.phaser.camera.flash(undefined, 1000, 1, 0.2);
			}, duration);
		},
		heal: function(amount, variation){
			amount = amount || Game.player.max_health;

			Game.player.health = Math.min(Game.player.max_health, Game.player.health + (variation ? Cjs.rand(amount - variation, amount + variation) : amount));

			Game.hud.update();
		},
		hurt: function(by, amount, variation){
			if(Game.player.justHurt) return; //todo make this depend on what the damage is from

			Game.player.justHurt = true;
			Game.player.justHurt_TO = setTimeout(function(){ Game.player.justHurt = false; }, 800);

			Game.player.health = Math.max(0, Game.player.health - (variation ? Cjs.rand(amount - variation, amount + variation) : amount));

			if(Game.player.health <= 0) Game.player.kill(by);

			else if(Game.player.health <= 25){
				Game.notify('Your health is\nrunning low', 1.5);
			}

			else Game.hud.update();
		},
		refuel: function(amount, variation){
			Game.player.fuel = Math.min(Game.player.max_fuel, Game.player.fuel + (variation ? Cjs.rand(amount - variation, amount + variation) : amount));
		},
		useFuel: function(amount, variation){
			Game.player.fuel = Math.max(0, Game.player.fuel - (variation ? Cjs.rand(amount - variation, amount + variation) : amount));

			if(Game.player.fuel <= 0) Game.player.kill('fuel');

			else if(Game.player.fuel <= 1){
				Game.notify('Your fuel is\nrunning low', 1.5);
			}

			else Game.hud.update();
		},
		getInvItem: function(itemName, count){
			Game.player.inventory[itemName] = Game.player.inventory[itemName] !== undefined ? Game.player.inventory[itemName] : 0;

			Game.player.inventory[itemName] += count || 1;
		},
		loseInvItem: function(itemName, count){
			if(!Game.player.inventory[itemName]) return;

			Game.player.inventory[itemName] -= count || 1;

			if(Game.player.inventory[itemName] < 1) delete Game.player.inventory[itemName];
		},
		getHullItem: function(itemName, count){
			count = count || 1;

			var weight, isMineral = itemName.startsWith('mineral');
			var densityMod = Game.config.densities[itemName.replace('mineral_', '').replace('ground_', '')] * 0.0001;

			if(isMineral) weight = densityMod;
			else weight = 0.07 + densityMod;

			if(Game.player.hull.space < (weight * count)) return false;

			Game.player.hull.space -= (weight * count);

			Game.player.hull[itemName] = Game.player.hull[itemName] !== undefined ? Game.player.hull[itemName] : 0;

			Game.player.hull[itemName] += count;

			return true;
		},
		teleport: function(pos){
			var teleportPos;

			Game.player.sprite.animations.play('teleporting');

			if(pos === 'spaceco'){
				teleportPos = Game.toGridPos(Game.spaceco.sprite);
			}

			else if(pos === 'responder'){
				teleportPos = Game.toGridPos(Game.player.responder);
			}

			else if(typeof pos === 'object'){
				teleportPos = pos;
			}

			Game.player.move('teleport', null, teleportPos);
		},
		intractable: function(){
			//todo notify and provide a custom interaction screen for things like bomb disarm, loot drop, responder disarm
		},
		collect: function(itemSprite){
			if(itemSprite.startsWith('mineral_')){
				var gotIt = Game.effects.getHullItem(itemSprite);

				if(!gotIt) return;
			}

			var animationTime = 200 + Math.ceil(Game.phaser.math.distance(Game.phaser.camera.x, Game.phaser.camera.y, itemSprite.x, itemSprite.y));

			Game.phaser.add.tween(itemSprite).to({ x: Game.phaser.camera.x, y: Game.phaser.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);

			setTimeout(itemSprite.kill, animationTime);

		},
		dropItem: function(itemName, pos){
			//todo create item at pos
		}
	},
	applyEffects: function(effects, pos){
		pos = pos && pos.x && pos.y ? pos : Game.toGridPos(Game.player.sprite);

		for(var x = 0; x < effects.length; ++x){
			var params = effects[x].split(':~:'), effect = params.shift();

			if({ poisonous_gas: 1, noxious_gas: 1, lava: 1, exploding: 1, freezing: 1, dropItem: 1 }[effect]) params[1] = pos;

			else if({ bonus: 1 }[effect]) params[3] = JSON.parse(params[2]);

			else if({ collect: 1 }[effect]) params[1] = arguments[2];

			Game.effects[effect].apply(null, params);
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
		if(Game.achievements[name].achieved) return;
		Game.achievements[name].achieved = true;

		Game.notify(Game.achievements[name].text);

		Game.applyEffects(Game.achievements[name].effects);
	},
	normalizePosition: function(x, y){
		x = Math.floor(x / (Game.blockPx / 2)) * (Game.blockPx / 2);
		y = Math.floor(y / (Game.blockPx / 2)) * (Game.blockPx / 2);

		return { x: x, y: y };
	},
	notify: function(text, timeout){
		if(Game.notifyText === text) return;

		if(Game.notify_TO){
			clearTimeout(Game.notify_TO);

			Game.hud.statusText.setText('');

			Game.notifyText = '';
		}

		Game.phaser.add.tween(Game.hud.scale).to({ x: 1.2, y: 1.2 }, 400, Phaser.Easing.Back.Out, true);

		Game.hud.statusText.setText(text);

		Game.notifyText = text;

		setTimeout(function(){
			if(Game.hud.isOpen) return;

			Game.phaser.add.tween(Game.hud.scale).to({ x: 0.5, y: 0.5 }, 400, Phaser.Easing.Circular.Out, true);
		}, 350);

		Game.notify_TO = setTimeout(function(){
			Game.notify_TO = null;

			Game.notifyText = null;

			if(Game.hud.isOpen) return;

			Game.hud.update();
		}, (timeout || 3) * 1000);
	},
	updateMaxHealth: function(){
		var health = 0;
		var tracksPart = Game.player.configuration.tracks.split(':~:');
		var hullPart = Game.player.configuration.hull.split(':~:');
		var drillPart = Game.player.configuration.drill.split(':~:');
		var materialBonus = { tritanium: 30, duranium: 35, pentrilium: 40, byzanium: 45, etherium: 50, mithril: 60, octanium: 65, saronite: 70, adamantite: 75, quadium: 80 };

		health += materialBonus[tracksPart[1]];
		health += materialBonus[hullPart[1]];
		health += materialBonus[drillPart[1]];

		Game.player.max_health = health;

		Game.player.health = Math.min(health, Game.player.health);
	},
	updateMaxFuel: function(){
		var maxFuel = 5;
		var fuelTankPart = Game.player.configuration.fuel_tank.split(':~:');

		if(fuelTankPart[0] === 'large') maxFuel = 10;
		if(fuelTankPart[0] === 'oversized') maxFuel = 15;
		if(fuelTankPart[0] === 'pressurized') maxFuel = 20;
		if(fuelTankPart[0] === 'battery') maxFuel = 35;
		if(fuelTankPart[0] === 'condenser') maxFuel = 45;

		Game.player.max_fuel = maxFuel;

		Game.player.fuel = Math.min(maxFuel, Game.player.fuel);
	},
	updateBaseMoveTime: function(){
		var moveTime = 200;
		var tracksPart = Game.player.configuration.tracks.split(':~:');
		var hullPart = Game.player.configuration.hull.split(':~:');
		var drillPart = Game.player.configuration.drill.split(':~:');
		var materialSlowDown = { tritanium: 40, duranium: 45, pentrilium: 60, byzanium: 75, etherium: 90, mithril: 110, octanium: 125, saronite: 135, adamantite: 150, quadium: 180 };

		moveTime += materialSlowDown[tracksPart[1]];
		moveTime += materialSlowDown[hullPart[1]];
		moveTime += materialSlowDown[drillPart[1]];

		if(tracksPart[0].includes('boosted')) moveTime -= parseInt(tracksPart[0].split('_')[1]) * 120;

		Game.player.baseMoveTime = Math.max(200, moveTime);
	},
	updateMaxHullSpace: function(){
		var hullSpace = 10;
		var hullPart = Game.player.configuration.hull.split(':~:');

		if(hullPart[0] === 'large') hullSpace += 10;
		else if(hullPart[0] === 'oversized') hullSpace += 25;

		if(Game.player.hull.space !== undefined) Game.player.hull.space = hullSpace - (Game.player.max_hullSpace - Game.player.hull.space);
		else Game.player.hull.space = hullSpace;

		Game.player.max_hullSpace = hullSpace;
	},
	updateDrillSpeedMod: function(){
		var drillSpeedMod = 0;
		var drillPart = Game.player.configuration.drill.split(':~:');

		if(drillPart[0].includes('precision')) drillSpeedMod = parseInt(drillPart[0].split('_')[1]) * 30;
		if(drillPart[0] === 'quadratic') drillSpeedMod = 80;

		Game.player.drillSpeedMod = drillSpeedMod;
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

			ground = Game.mapPos(pos.x + xMod, pos.y + yMod).ground;

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

		return Game.config.map[x] !== undefined ? (Game.config.map[x][y] !== undefined ? Game.config.map[x][y] : Game.config.map[0][0]) : Game.config.map[0][0];
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

		for(var x = 0; x < Game.config.width; x++){
			for(var y = 0; y < Game.config.depth; y++){
				if(Game.mapPos(x, y).ground.name === name) found.push({ x: x, y: y });
			}
		}

		return found;
	},
	movePlayer: function(data){
		Game.phaser.add.tween(Game.players[data.player].sprite).to(data.position, data.moveTime, Phaser.Easing.Sinusoidal.InOut, true);

		Game.players[data.player].sprite.angle = data.angle;

		if(data.invertTexture) Game.players[data.player].sprite.scale.x = -Game.config.defaultPlayerScale;
		else Game.players[data.player].sprite.scale.x = Game.config.defaultPlayerScale;
	},
	setMapPos: function(pos, id, animation, fromServer){
		var oldGround = Game.mapPos(pos).ground, drawDelay = 0, drawVar;

		Log()('setMapPos', pos, 'from', oldGround.name, 'to', id, animation ? 'playing '+ animation : '');

		if(id === undefined || (oldGround.sprite && oldGround.sprite.alive)){
			if(oldGround.base === 'ground'){
				drawDelay = Game.config.densities[oldGround.variant];

				oldGround.sprite.tween = Game.phaser.add.tween(oldGround.sprite).to({ alpha: 0 }, drawDelay, Phaser.Easing.Cubic.In, true);
				oldGround.sprite.animations.play('crush');
			}

			else if({ lava: 1, noxious_gas: 1, poisonous_gas: 1 }[oldGround.name]){
				oldGround.sprite.kill();
			}

			else if(oldGround.base === 'monster'){
				//
			}

			else oldGround.sprite.destroy();
		}

		if({ lava: 1, noxious_gas: 1, poisonous_gas: 1 }[id]) drawVar = oldGround.sprite.spreadChance;

		setTimeout(function(){
			if(id) Game.drawTile(pos.x, pos.y, id, animation, drawVar);

			else{
				oldGround.sprite = oldGround.base = oldGround.variant = oldGround.name = undefined;
			}
		}, drawDelay + 100);

		if(!fromServer) WS.send({ command: 'player_set_map_position', pos: pos, id: id, animation: animation });
	},
	adjustViewPosition: function(newX, newY, time){
		// Log()('adjustViewPosition');

		newX = Math.max(0, Math.min(Game.toPx(Game.config.width) - Game.viewWidth - 32, newX));

		Game.phaser.add.tween(Game.phaser.camera).to({ x: newX, y: newY }, time, Phaser.Easing.Sinusoidal.InOut, true);
	},
	drawMap: function(){
		Log()('drawView');

		var top = 0;
		var left = 0;
		var bottom = Game.config.depth;
		var right = Game.config.width;

		Log()('drawing '+ (((bottom - top) + 1) * ((right - left) + 1)) +' sprites, from: x'+ left +' y'+ top +' TO x'+ right +' y'+ bottom);

		var drawn = 0;

		for(var x = left; x <= right; x++){
			for(var y = top; y <= bottom; y++){
				var mapPos = Game.mapPos(x, y);

				if(mapPos.ground.name) Game.drawTile(x, y, mapPos.ground.name);

				if(mapPos.items.names[0]) Game.entities.mineral.create(x, y, mapPos.items.names[0]);

				drawn++;
			}
		}

		Log()('drew: ', drawn);
	},
	drawTile: function(x, y, mapPos_0_name, animation){
		if(typeof mapPos_0_name !== 'string') return;

		var entity;

		if(mapPos_0_name.startsWith('ground')){
			entity = Game.entities.ground.create(x, y, mapPos_0_name);
		}

		else if(mapPos_0_name === 'lava'){
			entity = Game.entities.lava.create(x, y, animation ? (arguments[4] || 100) : undefined);
		}

		else if(mapPos_0_name === 'poisonous_gas'){
			entity = Game.entities.poisonous_gas.create(x, y, animation ? (arguments[4] || 100) : undefined);
		}

		else if(mapPos_0_name === 'noxious_gas'){
			entity = Game.entities.noxious_gas.create(x, y, animation ? (arguments[4] || 100) : undefined);
		}

		else if(mapPos_0_name.endsWith('monster')){
			entity = Game.entities.monster.create(x, y, mapPos_0_name.replace('_monster', ''));
		}

		Game.config.map[x][y].ground.sprite = entity;

		if(animation) entity.animations.play(animation);
	},
	dev: function(){
		Game.player.credits = 999;

		Game.player.fuel = Game.player.max_fuel;
		Game.player.health = Game.player.max_health;

		Game.player.inventory = {
			'quadratic:~:tritanium:~:drill': 1,
			'precision_2:~:tritanium:~:drill': 1,
			'boosted_3:~:tritanium:~:tracks': 1,
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