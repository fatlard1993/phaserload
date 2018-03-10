/* global Phaser, Log, WS */

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
	mapNames: ['red_monster', 'purple_monster', 'lava', 'poisonous_gas', 'noxious_gas', 'mineral_white', 'mineral_orange', 'mineral_yellow', 'mineral_green', 'mineral_teal', 'mineral_blue', 'mineral_purple', 'mineral_pink', 'mineral_red', 'mineral_black', 'ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black'],
	player: {},
	players: {},
	states: {},
	entities: {},
	effects: {
		explode: function(pos, radius){
			var distanceFromPlayer = Game.phaser.math.distance(pos.x, pos.y, Game.player.sprite.x, Game.player.sprite.y);

			var intensity = Math.max(1, (radius * 2) + (radius - (distanceFromPlayer / Game.blockPx)));
			Game.phaser.camera.shake(intensity / 1000, 1000);

			if(!Game.player.isDisoriented && (distanceFromPlayer / Game.blockPx) < 10) Game.phaser.camera.flash(undefined, 1000, 1, 0.3);

			WS.send({ command: 'explosion', pos: pos, radius: radius });

			if(Game.phaser.math.distance(pos.x, pos.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) < Game.blockPx * (radius + 1)){
				Game.spaceco.hurt((radius + 1) - (Game.phaser.math.distance(pos.x, pos.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) / Game.blockPx), 'an explosion');
			}

			if(distanceFromPlayer < Game.blockPx * radius){
				Game.effects.hurt('explosion', Game.randFloat(radius, radius * 2) * (radius - (distanceFromPlayer / Game.blockPx)), 3);
			}

			Game.ground.forEachAlive(function(ground){
				if(Game.phaser.math.distance(pos.x, pos.y, ground.x, ground.y) < Game.blockPx * radius){
					Game.entities.ground.crush({ x: ground.x, y: ground.y });
				}
			});

			Game.monsters.forEachAlive(function(monster){
				if(Game.phaser.math.distance(pos.x, pos.y, monster.x, monster.y) < Game.blockPx * radius){
					monster.kill();

					Game.setMapPos({ x: monster.x, y: monster.y }, -1);
				}
			});
		},
		freeze: function(pos, radius){
			if(!Game.player.isDisoriented) Game.phaser.camera.fade(0xFFFFFF, 3000, 1, 0.1);

			Game.lava.forEachAlive(function(lava){
				if(Game.phaser.math.distance(pos.x, pos.y, lava.x, lava.y) < Game.blockPx * radius){
					lava.kill();

					Game.entities.ground.create(lava.x, lava.y);
				}
			});

			setTimeout(function(){
				if(!Game.player.isDisoriented) Game.phaser.camera.flash(undefined, 1000, 1, 0.1);
			}, 3000);
		},
		exploding: function(chance, pos){
			if(Game.chance(chance)){
				Game.effects.explode({ x: pos.x, y: pos.y }, Game.rand(2, 3));
			}
		},
		freezing: function(chance, pos){
			if(Game.chance(chance)){
				Game.effects.freeze({ x: pos.x, y: pos.y }, Game.rand(2, 4));
			}
		},
		lava: function(chance, pos){
			if(Game.chance(chance)){
				Game.entities.lava.create(pos.x, pos.y, 1);
			}
		},
		poisonous_gas: function(chance, pos){
			if(Game.chance(chance)){
				Game.entities.poisonous_gas.create(pos.x, pos.y, 1);
			}
		},
		noxious_gas: function(chance, pos){
			if(Game.chance(chance)){
				Game.entities.noxious_gas.create(pos.x, pos.y, 1);
			}
		},
		lavaRelease: function(){
			for(var x = Game.blockPx / 2; x < Game.phaser.config.width; x += Game.blockPx){
				for(var y = Game.groundDepth - Game.viewHeight; y < Game.groundDepth; y += Game.blockPx){
					if(Game.chance(90) && Game.mapPos(x, y) === 'ground_red'){
						Game.entities.ground.crush({ x: x, y: y });
						Game.entities.lava.create(x, y, 1);
					}
				}
			}
		},
		repair: function(chance){
			if(Game.chance(chance)){
				Game.player.health = Game.player.max_health;
			}

			else{
				Game.player.health = Math.min(Game.player.max_health, Game.player.health + Game.randFloat(1, Game.player.max_health / 2));
			}
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
		hurt: function(by, amount, variation){
			if(Game.player.justHurt) return; //todo make this depend on what the damage is from

			Game.player.justHurt = true;
			Game.player.justHurt_TO = setTimeout(function(){ Game.player.justHurt = false; }, 800);

			Game.player.health = Math.max(0, Game.player.health - (variation ? Game.randFloat(amount - variation, amount + variation) : amount));

			if(Game.player.health <= 0) Game.player.kill(by);

			else if(Game.player.health <= 25){
				Game.notify('Your health is\nrunning low', 1.5);
			}

			else Game.hud.update();
		},
		refuel: function(amount, variation){
			Game.player.fuel = Math.min(Game.player.max_fuel, Game.player.fuel + (variation ? Game.randFloat(amount - variation, amount + variation) : amount));
		},
		useFuel: function(amount, variation){
			Game.player.fuel = Math.max(0, Game.player.fuel - (variation ? Game.randFloat(amount - variation, amount + variation) : amount));

			if(Game.player.fuel <= 0) Game.player.kill('fuel');

			else if(Game.player.fuel <= 1){
				Game.notify('Your fuel is\nrunning low', 1.5);
			}

			else Game.hud.update();
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
		var rect = Game.phaser.add.graphics(0, 0);
		rect.beginFill(color, 1);
		rect.drawRect(0, 0, width || Game.phaser.config.width, height || Game.phaser.height);
		rect.endFill();

		return rect;
	},
	fadeIn: function(length, color, delay){
		if(delay === undefined) delay = 0;
		if(color === undefined) color = 0x000000;
		if(length === undefined) length = 500;

		var curtain = Game.addRectangle(color);
		curtain.alpha = 1;
		Game.phaser.add.tween(curtain).to({ alpha: 0 }, length, Phaser.Easing.Quadratic.In, true, delay);
	},
	fadeOut: function(length, color, delay){
		if(delay === undefined) delay = 0;
		if(color === undefined) color = 0x000000;
		if(length === undefined) length = 500;

		var curtain = Game.addRectangle(color);
		curtain.alpha = 0;
		Game.phaser.add.tween(curtain).to({ alpha: 1 }, length, Phaser.Easing.Quadratic.In, true, delay);
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
	toId: function(name){
		return Game.mapNames.indexOf(name);
	},
	toName: function(id){
		return Game.mapNames[id];
	},
	toFixed: function(num, decimalPlaces, outputAsNumber){// no rounding, yay!
		var floatRegex = new RegExp('(^[0-9]*)\\.?([0-9]{0,' + (decimalPlaces - 1|| -1) + '}[1-9]{1}(?=.+?0*$))?');
		var output = String(num).match(floatRegex);
		output = output[1] + (output[2] ? '.'+ output[2] : '');

		return outputAsNumber ? parseFloat(output) : output;
	},
	capitalize: function(str, recursive, split){
		for(var i = 0, words = str.split(split || ' '); i < (recursive ? words.length : 1); i++){
			words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
		}

		return words.join(' ');
	},
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
	movePlayer: function(data){
		Game.phaser.add.tween(Game.players[data.player].sprite).to(data.position, data.moveTime, Phaser.Easing.Sinusoidal.InOut, true);

		Game.players[data.player].sprite.angle = data.angle;

		if(data.invertTexture) Game.players[data.player].sprite.scale.x = -Game.config.defaultPlayerScale;
		else Game.players[data.player].sprite.scale.x = Game.config.defaultPlayerScale;
	},
	setMapPos: function(pos, id, fromServer, animation){
		var gridPos = {
			x: Game.toGridPos(pos.x),
			y: Game.toGridPos(pos.y)
		};

		var oldName = Game.mapPosName(gridPos.x, gridPos.y);

		Log()('setMapPos', gridPos, 'from', oldName, 'to', Game.mapNames[id], animation ? 'playing '+ animation : '');

		Game.config.map[gridPos.x][gridPos.y][0] = id;
		// Game.config.viewBufferMap[gridPos.x][gridPos.y][0] = id;

		if(fromServer){
			if(id === -1) Game.cleanGroundSpriteAt(pos.x, pos.y, oldName);

			else Game.drawTile(gridPos.x, gridPos.y, Game.toName(id), animation);
		}

		else WS.send({ command: 'player_set_map_position', pos: pos, id: id, animation: animation });
	},
	viewBufferMap: [],
	viewBufferSize: 3,
	adjustViewPosition: function(newX, newY, time, direction){
		// Log()('adjustViewPosition');

		// var oldX = Game.phaser.camera.x;
		// var oldY = Game.phaser.camera.y;

		// var left = Math.max(0, Game.toGridPos(oldX > newX ? newX : oldX) - Game.viewBufferSize);
		// var top = Game.toGridPos(oldY > newY ? newY : oldY) - Game.viewBufferSize;
		// var right = Math.min(Game.config.width, Game.toGridPos((oldX < newX ? newX : oldX) + Game.viewWidth) + Game.viewBufferSize);
		// var bottom = Game.toGridPos((oldY < newY ? newY : oldY) + Game.viewHeight) + Game.viewBufferSize;

		// left = Math.max(0, Math.min(Game.toPx(Game.config.width) - Game.viewWidth - 32, left));
		newX = Math.max(0, Math.min(Game.toPx(Game.config.width) - Game.viewWidth - 32, newX));

		// if(direction) Game.drawViewDirection(direction, Math.abs(oldX - newX), Math.abs(oldY - newY));
		// Game.drawView(left, top, right, bottom);

		// Game.drawCurrentView();
		// Game.cleanupView();

		Game.phaser.add.tween(Game.phaser.camera).to({ x: newX, y: newY }, time, Phaser.Easing.Sinusoidal.InOut, true);

		// clearTimeout(Game.cleanup_TO);
		// Game.cleanup_TO = setTimeout(function(){
		// 	Game.cleanupView();
		// }, time + 200);
	},
	drawCurrentView: function(){
		Log()('drawCurrentView');

		Game.drawView(Game.toGridPos(Game.phaser.camera.x) - Game.viewBufferSize, Game.toGridPos(Game.phaser.camera.y) - Game.viewBufferSize, Game.toGridPos(Game.phaser.camera.x + Game.viewWidth) + Game.viewBufferSize, Game.toGridPos(Game.phaser.camera.y + Game.viewHeight) + Game.viewBufferSize);
	},
	drawViewDirection: function(direction, distanceX, distanceY){
		Log()('drawViewDirection');

		var modX = (distanceX || 0) + Game.viewBufferSize;
		var modY = (distanceY || 0) + Game.viewBufferSize;

		var left = direction === 'left' ? Game.toGridPos(Game.phaser.camera.x) - modX : Game.toGridPos(Game.phaser.camera.x + Game.viewWidth);
		var top = direction === 'up' ? Game.toGridPos(Game.phaser.camera.y) - modY : Game.toGridPos(Game.phaser.camera.y + Game.viewHeight);
		var right = direction === 'right' ? Game.toGridPos(Game.phaser.camera.x + Game.viewWidth) + modX : Game.toGridPos(Game.phaser.camera.x + Game.viewWidth);
		var bottom = direction === 'down' ? Game.toGridPos(Game.phaser.camera.y + Game.viewHeight) + modY : Game.toGridPos(Game.phaser.camera.y + Game.viewHeight);

		Game.drawView(left, top, right, bottom);
	},
	drawView: function(left, top, right, bottom){
		Log()('drawView');

		if(top - 3 < 0) top = 0;
		if(left - 3 < 0) left = 0;
		if(bottom + 3 > Game.config.depth) bottom = Game.config.depth;
		if(right + 3 > Game.config.width) right = Game.config.width;

		Log()('drawing '+ (((bottom - top) + 1) * ((right - left) + 1)) +' sprites, from: x'+ left +' y'+ top +' TO x'+ right +' y'+ bottom);

		var drawn = 0;

		for(var x = left; x <= right; x++){
			for(var y = top; y <= bottom; y++){
				var mapPos = Game.mapPos(x, y);
				// var viewBufferPos = Game.viewBufferPos(x, y);

				if((mapPos[0] < 0 && mapPos[1] < 0)) continue;//(viewBufferPos[0] === mapPos[0] && mapPos[1] < 0) ||

				var mapPos_0_name = Game.toName(mapPos[0]);

				if(mapPos[1] > 0){
					Game.entities.mineral.create(Game.toPx(x), Game.toPx(y), Game.toName(mapPos[1]));
				}

				Game.drawTile(x, y, mapPos_0_name);
				drawn++;
			}
		}

		Log()('drew: ', drawn);
	},
	logMap: function(){
		for(var y = 0; y <= Game.config.depth; ++y){
			var line = '';

			for(var x = 0; x <= Game.config.width; ++x){
				line += (Game.config.map[x] && Game.config.map[x][y]) ? (String(Game.config.map[x][y][0]).replace('-1', '#')) : '#';
			}

			Log()(line);
		}
	},
	logViewBuffer: function(){
		for(var y = 0; y <= Game.config.depth; ++y){
			var line = '';

			for(var x = 0; x <= Game.config.width; ++x){
				line += (Game.config.viewBufferMap[x] && Game.config.viewBufferMap[x][y]) ? (String(Game.config.viewBufferMap[x][y][0]).replace('-1', '#')) : '#';
			}

			Log()(line);
		}
	},
	drawTile: function(x, y, mapPos_0_name, animation){
		if(!mapPos_0_name) return;

		var entity;

		if(mapPos_0_name.startsWith('ground')){
			entity = Game.entities.ground.create(Game.toPx(x), Game.toPx(y), mapPos_0_name);
		}

		else if(mapPos_0_name === 'lava'){
			entity = Game.entities.lava.create(Game.toPx(x), Game.toPx(y));
		}

		else if(mapPos_0_name === 'poisonous_gas'){
			entity = Game.entities.poisonous_gas.create(Game.toPx(x), Game.toPx(y));
		}

		else if(mapPos_0_name === 'noxious_gas'){
			entity = Game.entities.noxious_gas.create(Game.toPx(x), Game.toPx(y));
		}

		else if(mapPos_0_name.endsWith('monster')){
			entity = Game.entities.monster.create(Game.toPx(x), Game.toPx(y), mapPos_0_name.replace('_monster', ''));
		}

		if(animation) entity.animations.play(animation);

		// Game.config.viewBufferMap[x][y] = Game.config.map[x][y];
	},
	cleanGroundSpriteAt: function(x, y, name){
		Log()('cleanGroundSpriteAt', x, y);

		function cleanup(entity){
			if(entity.x === x && entity.y === y){
				// Game.config.viewBufferMap[Game.toGridPos(entity.x)][Game.toGridPos(entity.y)][0] = -1;
				Log()('killing: ', entity);

				if(name.startsWith('ground')) entity.animations.play('crush');

				else entity.kill();
			}
		}

		if(name.startsWith('ground')) this.ground.forEachAlive(cleanup);
		else if(name === 'lava') this.lava.forEachAlive(cleanup);
		else if(name === 'poisonous_gas') this.poisonous_gas.forEachAlive(cleanup);
		else if(name === 'noxious_gas') this.noxious_gas.forEachAlive(cleanup);
		else if(name === 'monsters') this.monsters.forEachAlive(cleanup);
		else Log.warn('cleanGroundSpriteAt: no defined name to search for');
	},
	cleanupView: function(force){
		if(!force && Game.phaser.tweens.isTweening(Game.phaser.camera)) return;
		Log()('cleanupView');

		var viewTop = this.phaser.camera.y;
		var viewLeft = this.phaser.camera.x;
		var viewBottom = this.phaser.camera.y + this.viewHeight;
		var viewRight = this.phaser.camera.x + this.viewWidth;

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
				// Log()('killing: ', entity);

				// Game.config.viewBufferMap[Game.toGridPos(entity.x)][Game.toGridPos(entity.y)][0] = -1;

				entity.kill();
			}
		}

		this.ground.forEachAlive(cleanup);
		this.lava.forEachAlive(cleanup);
		this.gas.forEachAlive(cleanup);
		this.monsters.forEachAlive(cleanup);
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