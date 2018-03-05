/* global Phaser, Game, WS, Log, Cjs */

Game.states.start = function(){};

Game.states.start.prototype.create = function(){
	Log()('start');

	if(Game.initialized) return;

	Game.initialized = 1;

	Game.phaser.camera.bounds = null;

	Game.ground = Game.phaser.add.group();
	Game.lava = Game.phaser.add.group();
	Game.gas = Game.phaser.add.group();
	Game.minerals = Game.phaser.add.group();
	Game.monsters = Game.phaser.add.group();

	Game.spaceco.sprite = Game.entities.spaceco.create(Game.spaceco);

	Game.playersGroup = Game.phaser.add.group();

	Game.hud = Game.entities.hud.create(0, 0);

	var playerNames = Object.keys(Game.players);

	for(var x = 0; x < playerNames.length; ++x){
		Game.players[playerNames[x]].sprite = Game.entities.player.create(Game.players[playerNames[x]]);
		if(playerNames[x] === Game.player.name) Game.player.sprite = Game.players[playerNames[x]].sprite;
	}

	Game.updateMaxHealth();
	Game.updateMaxFuel();
	Game.updateBaseMoveTime();
	Game.updateMaxHullSpace();
	Game.updateDrillSpeedMod();

	Game.player.move = function(direction, surrounds){
		Log()('player moving: ', direction);

		if(Game.hud.isOpen) Game.hud.close();

		surrounds = surrounds || Game.player.getSurrounds();

		var newPosition = {}, newCameraPosition, moveTime, canMove = true;

		if(direction.includes('teleport')){
			Game.player.sprite.animations.play('teleporting');

			var teleportPos = direction.includes('responder') ? { x: Game.player.responder.x, y: Game.player.responder.y } : { x: Game.spaceco.sprite.x, y: Game.spaceco.sprite.y };

			moveTime = Math.ceil(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, teleportPos.x, teleportPos.y));

			setTimeout(function(){
				// Game.drawCurrentView();

				Game.player.sprite.animations.play('normal');

				if(!direction.includes('responder')) Game.notify('Open to connect\nto Spaceco', 4);
			}, 200 + moveTime);

			newCameraPosition = { x: teleportPos.x - Game.viewWidth / 2, y: teleportPos.y - Game.viewHeight / 2 };

			newPosition.x = teleportPos.x;
			newPosition.y = teleportPos.y;
		}
		else{
			newPosition = {
				x: Game.player.sprite.x + (direction === 'left' ? -Game.blockPx : direction === 'right' ? Game.blockPx : 0),
				y: Game.player.sprite.y + (direction === 'up' ? -Game.blockPx : direction === 'down' ? Game.blockPx : 0)
			};

			var targetGroundType = Game.groundAt(newPosition.x, newPosition.y);
			moveTime = targetGroundType ? (Game.config.digTime[targetGroundType.replace('ground_', '')] ? Game.config.digTime[targetGroundType.replace('ground_', '')] - Game.player.drillSpeedMod : Game.player.baseMoveTime) : Game.player.baseMoveTime;

			if(direction === 'up' && Math.abs((Game.phaser.camera.y + Game.viewHeight) - Game.player.sprite.y) > Game.viewHeight / 2){
				newCameraPosition = { x: Game.phaser.camera.x, y: Game.phaser.camera.y - Game.blockPx };
			}
			else if(direction === 'down' && Math.abs(Game.phaser.camera.y - Game.player.sprite.y) > Game.viewHeight / 2){
				newCameraPosition = { x: Game.phaser.camera.x, y: Game.phaser.camera.y + Game.blockPx };
			}
			else if(direction === 'left' && Math.abs((Game.phaser.camera.x + Game.viewWidth) - Game.player.sprite.x) > Game.viewWidth / 2){
				newCameraPosition = { x: Game.phaser.camera.x - Game.blockPx, y: Game.phaser.camera.y };
			}
			else if(direction === 'right' && Math.abs(Game.phaser.camera.x - Game.player.sprite.x) > Game.viewWidth / 2){
				newCameraPosition = { x: Game.phaser.camera.x + Game.blockPx, y: Game.phaser.camera.y };
			}

			if(targetGroundType && targetGroundType.startsWith('ground')){
				canMove = !(Game.config.blockBehavior[targetGroundType.replace('ground_', '')] === 'impenetrable');

				Game.entities.ground.dig(newPosition);

				// Game.player.sprite.emitter = Game.phaser.add.emitter(0, 0, 100);
				// Game.player.sprite.addChild(Game.player.sprite.emitter);

				// var frameMod = Game.entities.ground.types.indexOf(targetGroundType.replace('ground_', '')) * 4;

				// Game.player.sprite.emitter.makeParticles('ground', [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod]);

				// Game.player.sprite.emitter.x = 32;

				// Game.player.sprite.emitter.setScale(0.1, 0.3, 0.1, 0.3);

				// Game.player.sprite.emitter.start(true, canMove ? moveTime + 100 : 150, null, Math.round(Game.rand(3, 7)));
			}

			var invertTexture = false;

			if(direction === 'up'){
				if(surrounds.left || surrounds.topLeft && !(surrounds.topRight && surrounds.topLeft && Game.player.lastMove === 'right')){
					invertTexture = true;
					Game.player.sprite.angle = 90;
				}
				else Game.player.sprite.angle = -90;
			}
			else if(direction === 'down'){
				if(surrounds.right || surrounds.bottomRight && !(surrounds.bottomRight && surrounds.bottomLeft && Game.player.lastMove === 'right')){
					invertTexture = true;
					Game.player.sprite.angle = -90;
				}
				else Game.player.sprite.angle = 90;
			}
			else{
				Game.player.sprite.angle = 0;
			}

			if(direction === 'left'){
				invertTexture = true;
			}

			if(invertTexture) Game.player.sprite.scale.x = -Game.config.defaultPlayerScale;
			else Game.player.sprite.scale.x = Game.config.defaultPlayerScale;

			Game.player.lastMoveInvert = invertTexture;
		}

		if(canMove){
			//if(targetGroundType && targetGroundType.startsWith('ground')) Game.phaser.camera.shake((moveTime * 0.00001) * 0.42, moveTime);

			// if(['gas', 'lava'].includes(targetType)) Game.entities[targetType].spread(newPosition.x, newPosition.y, 1);

			if(Game.config.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][1]) Game.entities.mineral.collect(newPosition);

			if(Game.player.hull.space < 0) moveTime += 250;

			Game.player.fuel -= moveTime * 0.0001;

			Game.player.lastMove = direction;

			Game.player.lastPosition = newPosition;

			Game.phaser.add.tween(Game.player.sprite).to(newPosition, moveTime, Phaser.Easing.Sinusoidal.InOut, true);

			if(newCameraPosition) Game.adjustViewPosition(newCameraPosition.x, newCameraPosition.y, moveTime, direction);

			WS.send({ command: 'player_move', position: newPosition, moveTime: moveTime, direction: direction, invertTexture: invertTexture, angle: Game.player.sprite.angle });
		}


		if(Game.player.fuel < 1.5) Game.notify('Your fuel is\nrunning low');

		else if(Game.player.hull.space < 1.5) Game.notify('Your Hull is\nalmost full');

		if(Game.phaser.math.distance(newPosition.x, newPosition.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) < Game.blockPx + 10){
			Game.notify('Open to connect\nto Spaceco', 4);

			Game.player.tradee = ':~:spaceco:~:';
		}

		else{
			var tradePlayer, playerNames = Object.keys(Game.players);

			for(var x = 0; x < playerNames.length; ++x){
				if(playerNames[x] === Game.player.name) continue;

				var potentialTraderSprite = Game.players[playerNames[x]].sprite;
				if(newPosition.x === potentialTraderSprite.x && newPosition.y === potentialTraderSprite.y) tradePlayer = playerNames[x];
			}

			// if(!tradePlayer && Game.hud.isOpen) Game.hud.close();

			// else
			if(tradePlayer){
				Game.notify('Open to trade\nwith '+ tradePlayer, 4);

				Game.player.tradee = tradePlayer;
			}
			else Game.player.tradee = null;
		}

		setTimeout(function(){
			Game.hud.update();

			if(Game.player.sprite.emitter){
				Game.player.sprite.emitter.destroy();
				Game.player.sprite.emitter = null;
			}
		}, moveTime + 150);
	};

	Game.player.checkMove = function(direction, surrounds){
		var canMove = 1;

		if(direction === 'left' && (Game.player.sprite.x <= Game.blockPx/2 || (!surrounds.bottomLeft && !surrounds.bottom && !surrounds.farLeft))){
			canMove = 0;
		}
		else if(direction === 'right' && (Game.player.sprite.x >= (Game.config.width * 64) - 32 || (!surrounds.bottomRight && !surrounds.bottom && !surrounds.farRight))){
			canMove = 0;
		}
		else if(direction === 'down' && Game.player.sprite.y === Game.toPx(Game.config.depth - 2)){
			canMove = 0;
		}
		else if(direction === 'up' && (!surrounds.left && !surrounds.right && !surrounds.topLeft && !surrounds.topRight)){
			canMove = 0;
		}

		Log()('can'+ (canMove ? '' : 't') +' move '+ direction);

		return canMove;
	};

	Game.player.getSurrounds = function(){
		return {
			left: Game.groundAt(Game.player.sprite.x - Game.blockPx, Game.player.sprite.y),
			farLeft: Game.groundAt(Game.player.sprite.x - (Game.blockPx * 2), Game.player.sprite.y),
			topLeft: Game.groundAt(Game.player.sprite.x - Game.blockPx, Game.player.sprite.y - Game.blockPx),
			top: Game.groundAt(Game.player.sprite.x, Game.player.sprite.y - Game.blockPx),
			topRight: Game.groundAt(Game.player.sprite.x + Game.blockPx, Game.player.sprite.y - Game.blockPx),
			right: Game.groundAt(Game.player.sprite.x + Game.blockPx, Game.player.sprite.y),
			farRight: Game.groundAt(Game.player.sprite.x + (Game.blockPx * 2), Game.player.sprite.y),
			bottomRight: Game.groundAt(Game.player.sprite.x + Game.blockPx, Game.player.sprite.y + Game.blockPx),
			bottom: Game.groundAt(Game.player.sprite.x, Game.player.sprite.y + Game.blockPx),
			bottomLeft: Game.groundAt(Game.player.sprite.x - Game.blockPx, Game.player.sprite.y + Game.blockPx)
		};
	};

	Game.player.useItem = function(slotNum, item){
		if(Game.player.justUsedItem || !Game['itemSlot'+ slotNum].item || Game['itemSlot'+ slotNum].item === '') return;

		if(Game.player.justUsedItem_TO){
			clearTimeout(Game.player.justUsedItem_TO);
			Game.player.justUsedItem_TO = null;
		}

		if(!Game.player.justUsedItem_TO){
			Game.player.justUsedItem = true;
			Game.player.justUsedItem_TO = setTimeout(function(){
				Game.player.justUsedItem = false;
			}, 500);
		}

		if(item === 'teleporter'){
			Game.player.move('teleport');
		}

		else if(item.includes('charge')){
			if(Game.player.activeCharge){
				Game.notify('You have already\nplaced a charge');

				return;
			}

			var frame = 0;

			if(item.includes('freeze')) frame += 4;

			if(item.includes('remote')){
				frame += 2;

				Game.entities.itemSlot.setItem(slotNum, '');
				Game.entities.itemSlot.setItem(slotNum, 'detonator');
			}

			else{
				Game.player.charge_TO = setTimeout(function(){
					Game.player.activeCharge.frame++;

					Game.effects[Game.player.activeChargeType.includes('freeze') ? 'freeze' : 'explode']({ x: Game.player.activeCharge.x, y: Game.player.activeCharge.y }, Game.player.activeChargeType.includes('remote') ? 5 : 3);

					setTimeout(function(){
						Game.player.activeCharge.destroy();
						Game.player.activeCharge = null;
						Game.player.activeChargeType = null;
					}, 1000);
				}, 3*1000);
			}

			Game.player.activeChargeType = item;

			Game.player.activeCharge = Game.phaser.add.sprite(Game.player.sprite.x, Game.player.sprite.y, 'explosive');
			Game.player.activeCharge.anchor.setTo(0.5, 0);
			Game.player.activeCharge.frame = frame;
		}

		else if(item === 'detonator'){
			Game['itemSlot'+ slotNum].itemSprite.animations.play('use');

			Game.player.charge_TO = setTimeout(function(){
				Game.player.activeCharge.frame++;

				Game.effects[Game.player.activeChargeType.includes('freeze') ? 'freeze' : 'explode']({ x: Game.player.activeCharge.x, y: Game.player.activeCharge.y }, Game.player.activeChargeType.includes('remote') ? 5 : 3);

				setTimeout(function(){
					Game.entities.itemSlot.setItem(slotNum, '');

					if(Game.player.inventory[Game.player.activeChargeType] > 0) Game.entities.itemSlot.setItem(slotNum, Game.player.activeChargeType);

					Game.player.activeCharge.destroy();
					Game.player.activeCharge = null;
					Game.player.activeChargeType = null;
				}, 1000);
			}, 1000);
		}

		else if(item === 'responder_teleporter'){
			if(!Game.player.responder){
				Game.player.responder = Game.phaser.add.sprite(Game.player.sprite.x, Game.player.sprite.y, 'responder');
				Game.player.responder.anchor.setTo(0.5, 0);
				Game.player.responder.animations.add('active', [0, 1], 5, true);
				Game.player.responder.animations.play('active');

				Game.player.move('teleport');
			}

			else{
				Game.player.move('responder_teleport');

				Game.player.responder.destroy();
				Game.player.responder = null;
			}
		}

		else{
			Log()(item, ' not yet implemented use func');
		}

		if(item !== 'detonator'){
			if(item === 'responder_teleporter' && Game.player.responder) return;

			Game.player.inventory[item]--;

			if(!Game.player.inventory[item]){
				delete Game.player.inventory[item];

				if(!item.includes('remote')) Game.entities.itemSlot.setItem(slotNum, '');
			}
		}
	};

	Game.player.openHUD = function(){
		if(Game.player.tradee === ':~:spaceco:~:') Game.spaceco.open();

		else if(Game.player.tradee) Game.hud.open('trade');

		else Game.hud.open('console');
	};

	Game.player.hurt = function(amount, by){
		if(Game.player.justHurt) return; //todo make this depend on what the damage is from

		Game.player.justHurt = true;
		Game.player.justHurt_TO = setTimeout(function(){ Game.player.justHurt = false; }, 500);

		Game.player.health -= amount;

		if(Game.player.health <= 0) Game.player.kill(by);

		else if(Game.player.health <= 25){
			Game.notify('Your health is\nrunning low');
		}

		Game.hud.update();
	};

	Game.player.kill = function(by){
		Game.loseDepth = Game.toGridPos(Game.player.sprite.y);
		Game.loseReason = by;

		WS.send({ command: 'player_death', by: by, at: Game.loseDepth });

		Game.player.sprite.kill();

		return Game.phaser.time.events.add(200, function(){ Game.phaser.state.start('end'); }, this);
	};

	Game.player.acceptOffer = function(){
		var itemNames = Object.keys(Game.player.tradeFor), x;

		for(x = 0; x < itemNames.length; ++x){
			Game.player.inventory[itemNames[x]] = Game.player.inventory[itemNames[x]] || 0;

			Game.player.inventory[itemNames[x]] += Game.player.tradeFor[itemNames[x]];
		}

		itemNames = Object.keys(Game.player.offer);

		for(x = 0; x < itemNames.length; ++x){
			Game.player.inventory[itemNames[x]] -= Game.player.offer[itemNames[x]];

			if(!Game.player.inventory[itemNames[x]]) delete Game.player.inventory[itemNames[x]];
		}

		Game.player.tradee = null;

		Game.player.offer_accepted = Game.player.offer_sent_accept = 0;

		Game.player.offer = {};
		Game.player.tradeFor = {};

		Game.hud.close();
	};

	Game.hud.update = function(){
		if(Game.hud.isOpen || Game.notify_TO) return;

		Game.hud.interfaceText.setText('');
		Game.hud.bottomLine.setText('');

		var hudItemNames = Object.keys(Game.config.hudLayout), hudItemCount = hudItemNames.length;
		var statusText;
		var shortestLength = 1;
		var longestLength = 6;

		for(var x = 0; x < hudItemCount; x++){
			var item = hudItemNames[x];
			var value = Game.config.hudLayout[hudItemNames[x]].split(':~:');
			var spacer = (' '.repeat(value[0].length > shortestLength ? longestLength - (value[0].length - shortestLength) : longestLength));
			if(statusText) statusText += '\n'+ value[0] + spacer;
			else statusText = value[0] + spacer;

			if(item === 'position') statusText += 'x'+ Game.toGridPos(Game.player.sprite.x) +' y'+ Game.toGridPos(Game.player.sprite.y);
			else if(item === 'health') statusText += Game.toFixed(Game.player.health, 2) +'/'+ Game.player.max_health;
			else if(item === 'fuel') statusText += Game.toFixed(Game.player.fuel, 2) +'/'+ Game.player.max_fuel;
			else if(item === 'credits') statusText += Game.toFixed(Game.player.credits, 2);
			else if(item === 'hull') statusText += Game.toFixed(Game.player.hull.space, 2) +'/'+ Game.player.max_hullSpace;
			else{
				if(item.startsWith('mineral') && Game.player.hull[item]) statusText += Game.player.hull[item];
			}
		}

		Game.hud.statusText.setText(statusText);
	};

	Game.hud.open = function(opts){
		// Log()('open hud', opts, Game.hud.isOpen);

		Game.hud.clear();

		if(typeof opts === 'string'){
			if(opts === 'briefing'){
				Game.hud.isOpen = opts = {
					name: 'briefing',
					heading: 'WELCOME',
					menuItems: ['Briefing', 'Help'],
					pageItems: []
				};
			}

			else if(opts === 'console'){
				Game.hud.isOpen = opts = {
					name: 'console',
					heading: 'CONSOLE',
					menuItems: ['Inventory', 'Hull', 'Config'],
					pageItems: []
				};
			}

			else if(opts === 'trade'){
				Game.hud.isOpen = opts = {
					name: 'trade',
					heading: 'TRADE',
					menuItems: ['Inventory', 'Offer', 'For', 'Accept'],
					pageItems: []
				};

				Game.player.offer_accepted = Game.player.offer_sent_accept = 0;

				Game.player.offer = {};
				Game.player.tradeFor = {};
			}
		}

		else Game.hud.isOpen = opts = opts || Game.hud.isOpen;

		if(!opts) return;

		opts.heading = opts.heading || '';
		opts.name = opts.name || 'unnamed';
		opts.view = opts.view || '';
		opts.menuItems = opts.menuItems || [];
		opts.pageItems = opts.pageItems || [];

		var x, text = '', spacer, pageItemCount = Math.min(7, opts.pageItems.length), splitPageItem, pageItem, pageItemPrice;
		var menuItemCount = Math.min(4, opts.menuItems.length);

		text += ' '.repeat(18 - (opts.heading.length / 2)) + opts.heading + ' '.repeat(14 - (opts.heading.length / 2)) +'EXIT\n';

		for(x = 0; x < menuItemCount; ++x){
			if(!opts.menuItems[x]) continue;

			spacer = 9 - (opts.menuItems[x].length);
			text += ' '.repeat(Math.floor(spacer / 2)) + opts.menuItems[x] + ' '.repeat(Math.ceil(spacer / 2)) + (x === (menuItemCount - 1) ? '\n' : '');
		}

		for(x = 0; x < pageItemCount; ++x){
			splitPageItem = opts.pageItems[x].split(':~:');
			pageItem = Cjs.capitalize(splitPageItem[0]);
			pageItemPrice = splitPageItem[1];

			text += pageItem;

			if(pageItemPrice){
				if(opts.view === 'config'){
					text += ': '+ pageItemPrice;
				}

				else{
					spacer = ' '.repeat(31 - pageItem.length);
					text += spacer + pageItemPrice;
				}
			}

			text += '\n';
		}

		Game.hud.interfaceText.setText(text);

		if(opts.name === 'spaceco') Game.spaceco.updateBottomLine();

		var scale = { x: 1.79, y: 1.79 };

		Game.phaser.add.tween(Game.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
	};

	Game.hud.close = function(){
		Log()('close hud');

		Game.hud.isOpen = false;

		if(Game.hud.briefingOpen) Game.hud.briefingOpen = false;

		if(Game.hud.emitter){
			Game.hud.emitter.destroy();
			Game.hud.emitter = null;
		}

		Game.player.tradee = null;

		Game.hud.interfaceText.setText('');
		Game.hud.bottomLine.setText('');

		Game.phaser.add.tween(Game.hud.scale).to({ x: 0.5, y: 0.5 }, 600, Phaser.Easing.Circular.Out, true);

		Game.hud.update();
	};

	Game.hud.clear = function(){
		Game.hud.statusText.setText('');
		Game.hud.interfaceText.setText('');
		Game.hud.bottomLine.setText('');
	};

	Game.hud.handlePointer = function(pointer){
		// Log()(pointer.x, pointer.y);
		if(!Game.hud.isOpen) return;

		if(pointer.x >= 450 && pointer.x <= 550 && pointer.y >= 25 && pointer.y <= 70){// exit
			Game.hud.close();
		}

		else if(pointer.y > 70 && pointer.y < 105){// menu
			if(pointer.x > 30 && pointer.x < 160){
				Game.hud.useMenu(0);
				// if(Game.hud.briefingOpen){
				// 	Log()('briefing');
				// 	Game.hud.setView('briefing');
				// }
			}

			else if(pointer.x > 160 && pointer.x < 290){
				Game.hud.useMenu(1);
				// if(Game.hud.briefingOpen){
				// 	Log()('help');
				// 	Game.hud.setView('help');
				// }
			}

			else if(pointer.x > 290 && pointer.x < 415){
				Game.hud.useMenu(2);
			}

			else if(pointer.x > 415 && pointer.x < 550){
				Game.hud.useMenu(3);
			}
		}

		else if(pointer.y > 105 && pointer.y < 380 && pointer.x > 30 && pointer.x < 550){// pageItems
			if(pointer.y > 105 && pointer.y < 140){
				Game.hud.selectItem(0);
			}

			else if(pointer.y > 140 && pointer.y < 185){
				Game.hud.selectItem(1);
			}

			else if(pointer.y > 185 && pointer.y < 225){
				Game.hud.selectItem(2);
			}

			else if(pointer.y > 225 && pointer.y < 265){
				Game.hud.selectItem(3);
			}

			else if(pointer.y > 265 && pointer.y < 305){
				Game.hud.selectItem(4);
			}

			else if(pointer.y > 305 && pointer.y < 345){
				Game.hud.selectItem(5);
			}

			else if(pointer.y > 345 && pointer.y < 385){
				Game.hud.selectItem(6);
			}
		}

		else{// outside / dead space
			// Game.hud.close();
		}
	};

	Game.hud.useMenu = function(selection){
		// Log()('useMenu', selection);

		if(!Game.hud.isOpen) return;

		var x;

		if(Game.hud.isOpen.name === 'briefing'){
			Game.hud.isOpen.menuItems = ['Briefing', 'Help'];

			if(selection === 0){
				var briefingLines = Game.briefingText, briefingLineCount = briefingLines.length;

				if(Game.hud.isOpen.view === 'briefing' && briefingLineCount > 7){
					Game.hud.isOpen.view = 'briefing_pg2';
					Game.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = briefingLines.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'briefing_pg2' && briefingLineCount > 14){
					Game.hud.isOpen.view = 'briefing_pg3';
					Game.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = briefingLines.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'briefing';
					Game.hud.isOpen.menuItems[0] = '[ pg 1 ]';
					Game.hud.isOpen.pageItems = briefingLines.slice(0, 7);
				}
			}

			else if(selection === 1){
				var helpLines = Game.helpText, helpLineCount = helpLines.length;

				if(Game.hud.isOpen.view === 'help' && helpLineCount > 7){
					Game.hud.isOpen.view = 'help_pg2';
					Game.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = helpLines.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'help_pg2' && helpLineCount > 14){
					Game.hud.isOpen.view = 'help_pg3';
					Game.hud.isOpen.menuItems[1] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = helpLines.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'help';
					Game.hud.isOpen.menuItems[1] = '[ pg 1 ]';
					Game.hud.isOpen.pageItems = helpLines.slice(0, 7);
				}
			}
		}

		else if(Game.hud.isOpen.name === 'console'){
			Game.hud.isOpen.menuItems = ['Inventory', 'Hull', 'Config'];

			if(selection === 0){
				var inventoryItems = Object.keys(Game.player.inventory), inventoryItemCount = inventoryItems.length;

				for(x = 0; x < inventoryItemCount; ++x){
					inventoryItems[x] = Game.capitalize(Game.capitalize(inventoryItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.inventory[inventoryItems[x]];

					if(Game.itemSlot1.item === inventoryItems[x]) inventoryItems[x] = '[ 1 ] '+ inventoryItems[x];
					else if(Game.itemSlot2.item === inventoryItems[x]) inventoryItems[x] = '[ 2 ] '+ inventoryItems[x];
				}

				if(Game.hud.isOpen.view === 'inventory' && inventoryItemCount > 7){
					Game.hud.isOpen.view = 'inventory_pg2';
					Game.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = inventoryItems.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'inventory_pg2' && inventoryItemCount > 14){
					Game.hud.isOpen.view = 'inventory_pg3';
					Game.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = inventoryItems.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'inventory';
					Game.hud.isOpen.menuItems[0] = inventoryItemCount <= 7 ? '[ Inv ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = inventoryItems.slice(0, 7);
				}
			}

			else if(selection === 1){
				var hullItems = Object.keys(Game.player.hull), hullItemCount = hullItems.length;

				for(x = 0; x < hullItemCount; ++x){
					hullItems[x] = Game.capitalize(hullItems[x], 1, '_') +':~:'+ Game.toFixed(Game.player.hull[hullItems[x]], 2);
				}

				if(Game.hud.view === 'hull' && hullItemCount > 7){
					Game.hud.isOpen.view = 'hull_pg2';
					Game.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = hullItems.slice(7, 14);
				}
				else if(Game.hud.view === 'hull_pg2' && hullItemCount > 14){
					Game.hud.isOpen.view = 'hull_pg3';
					Game.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = hullItems.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'hull';
					Game.hud.isOpen.menuItems[1] = hullItemCount <= 7 ? '[ Hull ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = hullItems.slice(0, 7);
				}
			}

			else if(selection === 2){
				var configurationParts = Object.keys(Game.player.configuration), drillItemCount = configurationParts.length;

				for(x = 0; x < drillItemCount; ++x){
					configurationParts[x] = Game.capitalize(configurationParts[x], 1, '_') +':~:'+ Game.capitalize(Game.player.configuration[configurationParts[x]], 1, ':~:');
				}

				Game.hud.isOpen.view = 'config';
				Game.hud.isOpen.menuItems[2] = '[ Conf ]';
				Game.hud.isOpen.pageItems = configurationParts;
			}
		}

		else if(Game.hud.isOpen.name === 'spaceco'){
			Game.hud.isOpen.menuItems = ['Rates', 'Fuel', 'Parts', 'Shop'];

			if(selection === 0){
				var rawMaterials = ['ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_black', 'mineral_green', 'mineral_blue', 'mineral_red', 'mineral_purple', 'mineral_teal', 'mineral_unknown'];
				var rawMaterialCount = rawMaterials.length;

				for(x = 0; x < rawMaterialCount; ++x){
					rawMaterials[x] = Game.capitalize(rawMaterials[x], 1, '_') +':~:$'+ Game.spaceco.getValue(rawMaterials[x]).toFixed(2);
				}

				if(Game.hud.isOpen.view === 'rates' && rawMaterialCount > 7){
					Game.hud.isOpen.view = 'rates_pg2';
					Game.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = rawMaterials.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'rates_pg2' && rawMaterialCount > 14){
					Game.hud.isOpen.view = 'rates_pg3';
					Game.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = rawMaterials.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'rates';
					Game.hud.isOpen.menuItems[0] = rawMaterialCount <= 7 ? '[ Rates ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = rawMaterials.slice(0, 7);
				}
			}

			else if(selection === 1){
				var fuels = Object.keys(Game.config.spaceco.fuel);
				var fuelCount = fuels.length;

				for(x = 0; x < fuelCount; ++x){
					fuels[x] = Game.capitalize(fuels[x], 1, '_') +':~:$'+ Game.spaceco.getValue(fuels[x]);
				}

				Game.hud.isOpen.view = 'fuel';
				Game.hud.isOpen.menuItems[1] = '[ Fuel ]';
				Game.hud.isOpen.pageItems = fuels;
			}

			else if(selection === 2){
				var parts = Object.keys(Game.spaceco.parts);
				var partCount = parts.length;

				for(x = 0; x < partCount; ++x){
					parts[x] = Game.capitalize(parts[x], 1, ':~:') +':~:$'+ Game.spaceco.getValue(parts[x]);
				}

				if(Game.hud.isOpen.view === 'parts' && partCount > 7){
					Game.hud.isOpen.view = 'parts_pg2';
					Game.hud.isOpen.menuItems[2] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = parts.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'parts_pg2' && partCount > 14){
					Game.hud.isOpen.view = 'parts_pg3';
					Game.hud.isOpen.menuItems[2] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = parts.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'parts';
					Game.hud.isOpen.menuItems[2] = partCount <= 7 ? '[ Parts ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = parts.slice(0, 7);
				}
			}

			else if(selection === 3){
				var shopItems = Object.keys(Game.config.spaceco.shop);
				var shopCount = shopItems.length;

				for(x = 0; x < shopCount; ++x){
					shopItems[x] = Game.capitalize(shopItems[x], 1, '_') +':~:$'+ Game.spaceco.getValue(shopItems[x]);
				}

				if(Game.hud.isOpen.view === 'shop' && shopCount > 7){
					Game.hud.isOpen.view = 'shop_pg2';
					Game.hud.isOpen.menuItems[3] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = shopItems.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'shop_pg2' && shopCount > 14){
					Game.hud.isOpen.view = 'shop_pg3';
					Game.hud.isOpen.menuItems[3] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = shopItems.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'shop';
					Game.hud.isOpen.menuItems[3] = shopCount <= 7 ? '[ Shop ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = shopItems.slice(0, 7);
				}
			}
		}

		else if(Game.hud.isOpen.name === 'trade'){
			Game.hud.isOpen.menuItems = ['Inventory', 'Offer', 'For', 'Accept'];

			if(selection === 0){
				var tradeInventoryItems = Object.keys(Game.player.inventory), tradeInventoryItemCount = tradeInventoryItems.length;

				for(x = 0; x < tradeInventoryItemCount; ++x){
					tradeInventoryItems[x] = Game.capitalize(Game.capitalize(tradeInventoryItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.inventory[tradeInventoryItems[x]];
				}

				if(Game.hud.isOpen.view === 'tradeInventory' && tradeInventoryItemCount > 7){
					Game.hud.isOpen.view = 'tradeInventory_pg2';
					Game.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = tradeInventoryItems.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'tradeInventory_pg2' && tradeInventoryItemCount > 14){
					Game.hud.isOpen.view = 'tradeInventory_pg3';
					Game.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = tradeInventoryItems.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'tradeInventory';
					Game.hud.isOpen.menuItems[0] = tradeInventoryItemCount <= 7 ? '[ Inv ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = tradeInventoryItems.slice(0, 7);
				}
			}

			else if(selection === 1){
				var tradeOfferItems = Object.keys(Game.player.offer), tradeOfferItemCount = tradeOfferItems.length;

				for(x = 0; x < tradeOfferItemCount; ++x){
					tradeOfferItems[x] = Game.capitalize(Game.capitalize(tradeOfferItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.offer[tradeOfferItems[x]];
				}

				if(Game.hud.isOpen.view === 'tradeOffer' && tradeOfferItemCount > 7){
					Game.hud.isOpen.view = 'tradeOffer_pg2';
					Game.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = tradeOfferItems.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'tradeOffer_pg2' && tradeOfferItemCount > 14){
					Game.hud.isOpen.view = 'tradeOffer_pg3';
					Game.hud.isOpen.menuItems[1] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = tradeOfferItems.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'tradeOffer';
					Game.hud.isOpen.menuItems[1] = tradeOfferItemCount <= 7 ? '[ Offer ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = tradeOfferItems.slice(0, 7);
				}
			}

			else if(selection === 2){
				var tradeForItems = Object.keys(Game.player.tradeFor), tradeForItemCount = tradeForItems.length;

				for(x = 0; x < tradeForItemCount; ++x){
					tradeForItems[x] = Game.capitalize(Game.capitalize(tradeForItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.tradeFor[tradeForItems[x]];
				}

				if(Game.hud.isOpen.view === 'tradeFor' && tradeForItemCount > 7){
					Game.hud.isOpen.view = 'tradeFor_pg2';
					Game.hud.isOpen.menuItems[2] = '[ pg 2 ]';
					Game.hud.isOpen.pageItems = tradeForItems.slice(7, 14);
				}
				else if(Game.hud.isOpen.view === 'tradeFor_pg2' && tradeForItemCount > 14){
					Game.hud.isOpen.view = 'tradeFor_pg3';
					Game.hud.isOpen.menuItems[2] = '[ pg 3 ]';
					Game.hud.isOpen.pageItems = tradeForItems.slice(14, 21);
				}
				else{
					Game.hud.isOpen.view = 'tradeFor';
					Game.hud.isOpen.menuItems[2] = tradeForItemCount <= 7 ? '[ For ]' : '[ pg 1 ]';
					Game.hud.isOpen.pageItems = tradeForItems.slice(0, 7);
				}
			}

			else if(selection === 3){
				Game.player.offer_sent_accept = 1;

				Game.hud.isOpen.view = 'accept';
				Game.hud.isOpen.menuItems[3] = 'ACCEPTED';

				WS.send({ command: 'player_accept_offer', to: Game.player.tradee });

				if(Game.player.offer_accepted) Game.player.acceptOffer();

				else Game.hud.bottomLine.setText('offer accepted');
			}
		}

		else return;

		Game.hud.open();
	};

	Game.hud.selectItem = function(selection){
		// Log()('selectItem', selection);
		if(!Game.hud.isOpen) return;

		if(Game.hud.justSelectedItem) return;
		Game.hud.justSelectedItem = true;

		var timeout = 700, item, bottomLineText;

		if(Game.hud.isOpen.name === 'console'){
			if(Game.hud.isOpen.view.includes('inventory')){
				item = Object.keys(Game.player.inventory)[selection + (Game.hud.isOpen.view.includes('pg') ? (parseInt(Game.hud.isOpen.view.slice(-1)) - 1) * 7 : 0)];

				if(item){
					bottomLineText = 'Equipping '+ Game.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

					var itemBreakdown = item.split(':~:');

					if(itemBreakdown[2] && ['tracks', 'hull', 'drill', 'fuel_tank'].includes(itemBreakdown[2])){
						delete Game.player.inventory[item];

						Game.player.inventory[Game.player.configuration[itemBreakdown[2]] +':~:'+ itemBreakdown[2]] = 1;

						Game.player.configuration[itemBreakdown[2]] = itemBreakdown[0] +':~:'+ itemBreakdown[1];

						Game.updateMaxHealth();
						Game.updateMaxFuel();
						Game.updateBaseMoveTime();
						Game.updateMaxHullSpace();
						Game.updateDrillSpeedMod();

						redraw = 2;
					}

					else{
						var slot = 1;

						if(Game.itemSlot1.item === item){
							Game.entities.itemSlot.setItem(1, '');
							slot = 2;
						}

						else if(Game.itemSlot2.item === item){
							Game.entities.itemSlot.setItem(2, '');
							slot = -1;
						}

						if(slot > 0){
							if(Game['itemSlot'+ slot].item && !Game['itemSlot'+ (slot === 1 ? 2 : 1)].item) slot = slot === 1 ? 2 : 1;
							else if(Game['itemSlot'+ slot].item) Game.entities.itemSlot.setItem(slot, '');

							Game.entities.itemSlot.setItem(slot, item);
						}

						Game.hud.isOpen.pageItems[selection] = (slot > 0 ? '[ '+ slot +' ] ' : '') + Game.hud.isOpen.pageItems[selection].replace(/\[\s\d\s\]\s/, '');

						redraw = 0;
					}

					Game.hud.open();
				}
			}
		}

		else if(Game.hud.isOpen.name === 'spaceco'){
			item = Game.hud.isOpen.pageItems[selection];

			if(item){
				var canUse = true, redraw = false, price;

				item = item.toLowerCase().replace(/:~:.*/, '');

				if(Game.hud.isOpen.view.includes('parts')) item = item.replace(/\s/g, ':~:');

				else item = item.replace(/\s/g, '_');

				if(Game.hud.isOpen.view.includes('fuel')){
					timeout = 400;

					var fuelTankType = Game.player.configuration.fuel_tank.split(':~:')[0];

					if(Game.player.fuel >= Game.player.max_fuel){
						canUse = false;
						bottomLineText = 'Full!';
					}

					else if((item === 'fuel' && !['standard', 'large', 'oversized', 'pressurized'].includes(fuelTankType)) || (item === 'energy' && fuelTankType !== 'battery') || (item === 'super_oxygen_liquid_nitrogen' && fuelTankType !== 'condenser')){
						canUse = false;
						bottomLineText = 'Cant use this fuel type!';
					}
				}

				else if(Game.hud.isOpen.view.includes('parts')){
					// todo?
				}

				else if(Game.hud.isOpen.view.includes('shop')){
					price = Game.spaceco.getValue(item);

					if(item === 'repair' && Game.player.health >= Game.player.max_health){
						canUse = false;
						bottomLineText = 'Fully repaired!';
					}

					else if(item === 'transport'){
						canUse = false;
						bottomLineText = 'Transport not implemented yet!';
					}
				}

				price = Game.spaceco.getValue(item);

				if(Game.player.credits < price){
					canUse = false;
					bottomLineText = 'Not enough credits!';
				}

				if(canUse){
					Game.player.credits -= price;

					bottomLineText = Game.hud.isOpen.pageItems[selection].replace(':~:' ,' : ');

					if(item === 'gas'){
						Game.player.fuel += 1.5;
					}

					else if(item === 'energy'){
						Game.player.fuel += 3.2;
					}

					else if(item === 'super_oxygen_liquid_nitrogen'){
						Game.player.fuel += 6.9;
					}

					else if(item === 'repair'){
						Game.player.health = Game.player.max_health;
					}

					else if(Game.hud.isOpen.view.includes('shop')){
						Game.player.inventory[item] = Game.player.inventory[item] || 0;
						Game.player.inventory[item]++;
					}

					else if(Game.hud.isOpen.view.includes('parts')){
						Game.player.inventory[item] = Game.player.inventory[item] || 0;
						Game.player.inventory[item]++;

						delete Game.spaceco.parts[item];

						WS.send({ command: 'player_purchase_part', partName: item });

						redraw = 2;

						Log()(price, item);
					}
				}
			}
		}

		else if(Game.hud.isOpen.name === 'trade'){
			if(Game.hud.isOpen.view.includes('Inventory')){
				item = Object.keys(Game.player.inventory)[selection + (Game.hud.isOpen.view.includes('pg') ? (parseInt(Game.hud.isOpen.view.slice(-1)) - 1) * 7 : 0)];

				if(item){
					bottomLineText = 'Offering '+ Game.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

					Game.player.offer[item] = Game.player.offer[item] || 0;

					Game.player.offer[item] = Math.min(Game.player.offer[item] + 1, Game.player.inventory[item]);

					WS.send({ command: 'player_update_offer', to: Game.player.tradee, offer: Game.player.offer });

					Game.player.offer_accepted = Game.player.offer_sent_accept = 0;

					redraw = 1;
				}
			}

			else if(Game.hud.isOpen.view.includes('Offer')){
				item = Object.keys(Game.player.offer)[selection + (Game.hud.isOpen.view.includes('pg') ? (parseInt(Game.hud.isOpen.view.slice(-1)) - 1) * 7 : 0)];

				if(item){
					bottomLineText = 'Revoking '+ Game.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

					--Game.player.offer[item];

					if(!Game.player.offer[item]) delete Game.player.offer[item];

					WS.send({ command: 'player_update_offer', to: Game.player.tradee, offer: Game.player.offer });

					Game.player.offer_accepted = Game.player.offer_sent_accept = 0;

					redraw = 1;
				}
			}
		}

		if(bottomLineText) Game.hud.bottomLine.setText(bottomLineText);

		Game.hud.justSelectedItem_TO = setTimeout(function(){
			Game.hud.justSelectedItem = false;

			if(Game.hud.isOpen.name === 'spaceco') Game.spaceco.updateBottomLine();

			if(redraw) Game.hud.useMenu(redraw);
		}, timeout);
	};

	Game.spaceco.boot = function(){
		if(Game.hud.isOpen.name !== 'spaceco') return;

		// Game.spaceco.setInterfaceText('\n				Im sorry, but...\n			if you have no money\n		we simply cant help you.');

		Game.hud.open({
			name: 'spaceco',
			pageItems: ['Im sorry, but...', 'if you have no money', 'we simply cant help you.']
		});

		setTimeout(Game.hud.close, 3 * 1000);
	};

	Game.spaceco.open = function(){
		if(Game.hud.isOpen) return;

		Game.hud.open({
			name: 'spaceco',
			heading: 'SPACECO',
			pageItems: ['Welcome to Spaceco, we love you'],
			view: 'welcome'
		});

		Game.hud.bottomLine.setText('...');

		setTimeout(function(){
			var output = {
				name: 'spaceco',
				heading: 'SPACECO',
				menuItems: ['Rates', 'Fuel', 'Parts', 'Shop'],
				pageItems: [],
				view: 'welcome_2'
			};

			if(Game.config.mode === 'normal'){
				delete Game.player.hull.space;

				var hullItemNames = Object.keys(Game.player.hull);
				var statingCredits = Game.player.credits;
				var soldItems = {
					ground: 0,
					mineral: 0
				};
				var x;

				for(x = 0; x < hullItemNames.length; x++){
					Game.spaceco.resourceBay[hullItemNames[x]] = Game.spaceco.resourceBay[hullItemNames[x]] || 0;
					Game.spaceco.resourceBay[hullItemNames[x]] += Game.player.hull[hullItemNames[x]];

					var type = hullItemNames[x].replace(/_.*$/, '');
					soldItems[type] += Game.player.hull[hullItemNames[x]];

					// if(Game.player.hull[hullItemNames[x]] > 0) pageItem += hullItemNames[x] +': '+ Game.player.hull[hullItemNames[x]] +' * '+ Game.spaceco.getValue(hullItemNames[x]) +'\n';

					Game.player.credits += Game.player.hull[hullItemNames[x]] * Game.spaceco.getValue(hullItemNames[x]);
				}

				output.pageItems.push('Sold:');

				var soldItemNames = Object.keys(soldItems);

				for(x = 0; x < soldItemNames.length; ++x){
					output.pageItems.push(' '+ soldItems[soldItemNames[x]] +' x '+ soldItemNames[x] +'s');
				}

				output.pageItems.push('For '+ Game.toFixed(Game.player.credits - statingCredits, 2) +' credits');

				Game.player.hull = {
					space: Game.player.max_hullSpace
				};

				if(Game.player.credits - 0.1 < 0){
					Game.spaceco.getOut_TO = setTimeout(Game.spaceco.boot, 30 * 1000);
				}
			}

			Game.hud.open(output);
		}, 1500);
	};

	Game.spaceco.updateBottomLine = function(){
		if(Game.hud.isOpen.name !== 'spaceco') return;

		var credits = String(parseInt(Game.player.credits));
		var fuel = Game.toFixed(Game.player.fuel, 2);
		var health = String(parseInt(Game.player.health));

		var creditsText = ' '.repeat(7 - (credits.length / 2)) +'$:'+ credits;
		var fuelText = ' '.repeat(7 - (fuel.length / 2)) +'Fuel:'+ fuel;
		var healthText = ' '.repeat(7 - (health.length / 2)) +'Health:'+ health;

		Game.hud.bottomLine.setText(creditsText + fuelText + healthText);
	};

	Game.spaceco.hurt = function(amount, by){
		if(Game.spaceco.justHurt) return; //todo make this depend on what the damage is from
		Game.spaceco.justHurt = true;
		Game.spaceco.justHurt_TO = setTimeout(function(){ Game.spaceco.justHurt = false; }, 500);

		Game.spaceco.damage += amount;

		WS.send({ command: 'hurt_spaceco', amount: amount });

		if(!Game.spaceco.dead && Game.spaceco.damage > 9){
			Game.spaceco.dead = 1;

			setTimeout(function(){
				Game.spaceco.sprite.kill();

				Game.notify('Spaceco was killed\nby '+ by);
			}, 400);
		}

		else Game.spaceco.sprite.frame = Game.spaceco.damage;
	};

	Game.spaceco.getValue = function(name){
		var value;

		if(name.startsWith('ground')){
			value = Game.config.spaceco.baseGroundValue + (((Game.config.digTime[name.replace('ground_', '')] / 2) - (Game.spaceco.resourceBay[name] || 0)) / 1000);

			if(name === 'ground_green' && Game.config.mode === 'normal') value *= 2;
		}

		else if(name.startsWith('mineral')){
			value = Game.config.spaceco.mineralValues[name.replace('mineral_', '')] - ((Game.spaceco.resourceBay[name] || 0) / 40);
		}

		else if(Game.config.spaceco.fuel[name]){
			value = Game.config.spaceco.fuel[name];
		}

		else if(Game.config.spaceco.shop[name]){
			value = Game.config.spaceco.shop[name];
		}

		else if(Game.spaceco.parts[name]){
			value = Game.spaceco.parts[name];
		}

		return Math.max(0, value);
	};

	Game.itemSlot1 = Game.entities.itemSlot.create(Game.viewWidth - 32, 32);
	Game.itemSlot2 = Game.entities.itemSlot.create(Game.viewWidth - 32, 106);

	Game.hud.open('briefing');

	Game.drawView(0, 0, Game.config.width, Game.config.depth / 2);

	if(Game.purchasedTransport){
		Game.purchasedTransport = false;
	}
	else{
		Game.spaceco.resourceBay = {};

		Game.entities.itemSlot.setItem(1, 'teleporter');
	}

	Game.adjustViewPosition(Game.player.sprite.x - Game.viewWidth / 2, Game.player.sprite.y - Game.viewHeight / 2, Math.ceil(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, Game.phaser.camera.x / 2, Game.phaser.camera.y / 2)));
};

Game.states.start.prototype.update = function(){
	if(!Game.initialized) return;

	if(Game.config.mode === 'normal' && Game.player.fuel < 0){
		Game.player.kill('fuel');
	}

	// if(Game.player.sprite.emitter){// particle decay
	// 	Game.player.sprite.emitter.forEachAlive(function(particle){
	// 		particle.alpha = Math.max(0, Math.min(1, (particle.lifespan / Game.player.sprite.emitter.lifespan) * 2));
	// 	});
	// }

	Game.lava.forEachAlive(function checkLava(lava){
		if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, lava.x, lava.y) < Game.blockPx/2){
			Game.player.hurt(12 + Game.randFloat(1, 6), 'lava');
		}

		if(Game.phaser.math.distance(Game.spaceco.sprite.x, Game.spaceco.sprite.y, lava.x, lava.y) < Game.blockPx){
			Game.spaceco.hurt(1, 'lava');
		}

		Game.monsters.forEachAlive(function checkLava_monsters(monster){
			if(Game.phaser.math.distance(monster.x, monster.y, lava.x, lava.y) < Game.blockPx){
				monster.kill();

				Game.setMapPos({ x: monster.x, y: monster.y }, -1);
			}
		}, this);
	}, this);

	Game.gas.forEachAlive(function checkGas(gas){
		if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, gas.x, gas.y) < Game.blockPx/2){
			Game.player.hurt(10 + Game.randFloat(1, 5), 'gas');
		}

		Game.monsters.forEachAlive(function checkGas_monsters(monster){
			if(Game.phaser.math.distance(monster.x, monster.y, gas.x, gas.y) < Game.blockPx){
				monster.kill();

				Game.setMapPos({ x: monster.x, y: monster.y }, -1);
			}
		}, this);
	}, this);

	Game.monsters.forEachAlive(function checkMonsters(monster){
		if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, monster.x, monster.y) < Game.blockPx/2){
			Game.player.hurt(5 + Game.randFloat(1, 5), 'monster');
		}
	}, this);

	if(Game.spaceco.damage <= 10 && !Game.phaser.tweens.isTweening(Game.spaceco.sprite)){
		var gridPos = {
			x: Game.toGridPos(Game.spaceco.sprite.x),
			y: Game.toGridPos(Game.spaceco.sprite.y)
		};

		var spacecoGroundBase = {
			bottomRight: gridPos.x + 1 < Game.config.width ? Game.config.map[gridPos.x + 1][gridPos.y + 1][0] : -1,
			bottom: Game.config.map[gridPos.x][gridPos.y + 1][0],
			bottomLeft: gridPos.x - 1 >= 0 ? Game.config.map[gridPos.x - 1][gridPos.y + 1][0] : -1
		};

		if(spacecoGroundBase.bottomRight < 3 && spacecoGroundBase.bottom < 3 && spacecoGroundBase.bottomLeft < 3){
			Game.phaser.add.tween(Game.spaceco.sprite).to({ y: Game.spaceco.sprite.y + Game.blockPx }, 500, Phaser.Easing.Sinusoidal.InOut, true);

			Game.spaceco.hurt(1, 'falling');
		}
	}

	if(!Game.phaser.tweens.isTweening(Game.player.sprite)){
		var moving, altDirection;
		var surrounds = Game.player.getSurrounds();
		var hudIsTweening = Game.phaser.tweens.isTweening(Game.hud.scale);

		if(this.input.activePointer.isDown){
			if(Game.hud.isOpen && !hudIsTweening){//&& !Game.hud.justUsedItemSlot
				if(this.input.activePointer.x > 575 || this.input.activePointer.y > 460) Game.hud.close();

				else Game.hud.handlePointer(this.input.activePointer);

				return;
			}

			else if(!Game.hud.isOpen && Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, 70, 50) < 128){
				return Game.player.openHUD();
			}

			else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 32) < 32){
				if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;

				Game.hud.justUsedItemSlot = true;
				Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

				if(!Game.itemSlot1.item) Game.hud.open('console');

				else Game.player.useItem(1, Game.itemSlot1.item);

				return;
			}

			else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 106) < 32){
				if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;

				Game.hud.justUsedItemSlot = true;
				Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

				if(!Game.itemSlot2.item) Game.hud.open('console');

				else Game.player.useItem(2, Game.itemSlot2.item);

				return;
			}

			else{
				var xDiff = Game.player.sprite.x - this.input.activePointer.x - Game.phaser.camera.x;
				var yDiff = Game.player.sprite.y - this.input.activePointer.y - Game.phaser.camera.y;

				var xDirection = xDiff > 0 ? 'left' : 'right';
				var yDirection = yDiff > 0 ? 'up' : 'down';

				Log()(xDiff, yDiff);

				xDiff = Math.abs(xDiff);
				yDiff = Math.abs(yDiff);

				moving = xDiff > yDiff ? (xDiff > 10 ? xDirection : null) : (yDiff > 10 ? yDirection : null);
				altDirection = xDiff > yDiff ? (yDiff > 10 ? yDirection : null) : (xDiff > 10 ? xDirection : null);
			}
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.ESC) && !Game.justPressedEsc){
			Game.justPressedEsc = true;
			Game.justPressedEsc_TO = setTimeout(function(){ Game.justPressedEsc = false; }, 1000);

			if(Game.hud.isOpen) Game.hud.close();

			else Game.player.openHUD();

			return;
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.ONE)){
			return Game.player.useItem(1, Game.itemSlot1.item);
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.TWO)){
			return Game.player.useItem(2, Game.itemSlot2.item);
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.LEFT) || this.input.keyboard.isDown(Phaser.Keyboard.A)){
			moving = 'left';
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.RIGHT) || this.input.keyboard.isDown(Phaser.Keyboard.D)){
			moving = 'right';
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.DOWN) || this.input.keyboard.isDown(Phaser.Keyboard.S)){
			moving = 'down';
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.UP) || this.input.keyboard.isDown(Phaser.Keyboard.W)){
			moving = 'up';
		}

		var canMove;

		if(moving) canMove = Game.player.checkMove(moving, surrounds);

		if(!canMove && altDirection){
			canMove = Game.player.checkMove(altDirection, surrounds);
			if(canMove) moving = altDirection;
		}

		if(!canMove) moving = null;

		if(moving) Game.player.move(moving, surrounds);

		else if(!Game.player.justMoved){
			if(!surrounds.left && !surrounds.right && !surrounds.bottom){
				var direction;

				if(Game.player.lastMove === 'up' && (surrounds.bottomLeft || surrounds.bottomRight)){
					direction = surrounds.bottomLeft && !surrounds.bottomRight ? 'left' : (surrounds.bottomLeft && surrounds.bottomRight ? (Game.player.lastMoveInvert ? 'left' : 'right') : 'right');

					Log()('Automove from: '+ Game.player.lastMove +' to: '+ direction, surrounds);
				}
				else{
					direction = 'down';

					if(Game.player.lastMove === 'down') Game.player.hurt(Game.randFloat(1, 3), 'falling');

					Log()('falling');
				}

				Game.player.move(direction);
			}
		}
	}
};