/* global Phaser, Game, Socket, Log, Cjs */

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

	Game.spaceco.sprite = Game.entities.spaceco.create(Game.spaceco);

	Game.monsters = Game.phaser.add.group();

	var playerNames = Object.keys(Game.players);

	for(var x = 0; x < playerNames.length; ++x){
		Game.players[playerNames[x]].sprite = Game.entities.player.create(Game.players[playerNames[x]]);
		if(playerNames[x] === Game.player.name) Game.player.sprite = Game.players[playerNames[x]].sprite;
	}

	Game.player.move = function(direction){
		// console.log('Drill: On the move, goin: ', direction);

		var surrounds = Game.player.getSurrounds();

		if(direction === 'left' && (Game.player.sprite.x <= Game.blockPx/2 || (!surrounds.bottomLeft && !surrounds.bottom && !surrounds.farLeft))){
			return;
		}
		else if(direction === 'right' && (Game.player.sprite.x >= (Game.config.width * 64) - 32 || (!surrounds.bottomRight && !surrounds.bottom && !surrounds.farRight))){
			return;
		}
		else if(direction === 'down' && Game.player.sprite.y === Game.toPx(Game.config.depth - 2)){
			return;
		}
		else if(direction === 'up' && (!surrounds.left && !surrounds.right && !surrounds.topLeft && !surrounds.topRight)){
			return;
		}

		if(Game.player.justMoved_TO){
			clearTimeout(Game.player.justMoved_TO);
			Game.player.justMoved_TO = null;
		}
		if(!Game.player.justMoved_TO){
			Game.player.justMoved = true;
			Game.player.justMoved_TO = setTimeout(function(){
				Game.player.justMoved = false;
			}, 500);
		}

		var newPosition = {
			x: Game.player.sprite.x + (direction === 'left' ? -Game.blockPx : direction === 'right' ? Game.blockPx : 0),
			y: Game.player.sprite.y + (direction === 'up' ? -Game.blockPx : direction === 'down' ? Game.blockPx : 0)
		}, newCameraPosition;

		var targetGroundType = Game.groundAt(newPosition.x, newPosition.y);
		var targetType = Game.mapPosName(newPosition.x, newPosition.y);
		var moveTime = targetGroundType ? Game.config.digTime[targetGroundType.replace('ground_', '')] ? Game.config.digTime[targetGroundType.replace('ground_', '')] : Game.config.baseDrillMoveTime : Game.config.baseDrillMoveTime;

		if(direction.includes('teleport')){
			Game.player.sprite.animations.play('teleporting');

			var teleportPos = direction.includes('responder') ? { x: Game.player.responder.x, y: Game.player.responder.y } : { x: Game.spaceco.sprite.x, y: Game.spaceco.sprite.y };

			moveTime = Math.ceil(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, teleportPos.x, teleportPos.y));

			setTimeout(function(){
				// Game.drawCurrentView();
				Game.player.sprite.animations.play(Game.player.upgrade > 0 ? 'upgrade_'+ Game.player.upgrade : 'normal');
				if(!direction.includes('responder')) Game.notify('Open to connect\nto Spaceco', 4);
			}, 200 + moveTime);

			newCameraPosition = { x: teleportPos.x - Game.viewWidth / 2, y: teleportPos.y - Game.viewHeight / 2 };

			newPosition.x = teleportPos.x;
			newPosition.y = teleportPos.y;
		}
		else if(direction === 'up' && Math.abs((Game.phaser.camera.y + Game.viewHeight) - Game.player.sprite.y) > Game.viewHeight / 2){
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
			Game.player.sprite.emitter = Game.phaser.add.emitter(0, 0, 100);
			Game.player.sprite.addChild(Game.player.sprite.emitter);

			var frameMod = Game.entities.ground.types.indexOf(targetGroundType.replace('ground_', '')) * 4;

			Game.player.sprite.emitter.makeParticles('ground', [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod]);

			Game.player.sprite.emitter.x = 32;

			Game.player.sprite.emitter.setScale(0.1, 0.3, 0.1, 0.3);

			Game.player.sprite.emitter.start(true, moveTime + 100, null, Math.round(Game.rand(3, 7)));

			Game.entities.ground.dig(newPosition);
		}

		var mineralWeight = 0.08;

		if(Game.config.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][1] && Game.player.hull.space > mineralWeight){
			Game.minerals.forEachAlive(function(mineral){
				if(mineral.x === newPosition.x && mineral.y === newPosition.y){
					Game.player.hull.items[mineral.type] = Game.player.hull.items[mineral.type] !== undefined ? Game.player.hull.items[mineral.type] : 0;

					Game.player.hull.items[mineral.type]++;

					var animationTime = 200 + Math.ceil(Game.phaser.math.distance(Game.phaser.camera.x, Game.phaser.camera.y, mineral.x, mineral.y));

					Game.phaser.add.tween(mineral).to({ x: Game.phaser.camera.x, y: Game.phaser.camera.y }, animationTime, Phaser.Easing.Quadratic.Out, true);

					setTimeout(function(){
						Game.player.hull.space -= mineralWeight;

						// Game.config.map[Game.toGridPos(mineral.x)][Game.toGridPos(mineral.y)][1] = -1;
						// Game.config.viewBufferMap[Game.toGridPos(mineral.x)][Game.toGridPos(mineral.y)][1] = -1;

						mineral.kill();
					}, animationTime);
				}
			});
		}

		if(Game.player.hull.space < 0) moveTime += 250;

		moveTime = Math.max(Game.config.baseDrillMoveTime, moveTime - (((Game.player.upgrade || 0) + 1) * 50));

		//if(targetGroundType && targetGroundType.startsWith('ground')) Game.phaser.camera.shake((moveTime * 0.00001) * 0.42, moveTime);

		Game.phaser.add.tween(Game.player.sprite).to(newPosition, moveTime, Phaser.Easing.Sinusoidal.InOut, true);

		// if(['gas', 'lava'].includes(targetType)) Game.entities[targetType].spread(newPosition.x, newPosition.y, 1);

		if(newCameraPosition) Game.adjustViewPosition(newCameraPosition.x, newCameraPosition.y, moveTime, direction);

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
		Game.player.lastMove = direction;

		Game.player.lastPosition = newPosition;

		Socket.active.send(JSON.stringify({ command: 'player_move', position: newPosition, moveTime: moveTime, direction: direction, invertTexture: invertTexture, angle: Game.player.sprite.angle }));

		// Game.config.map[Game.toGridPos(Game.player.sprite.x)][Game.toGridPos(Game.player.sprite.y)][0] = -1;
		// Game.config.map[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][0] = Game.mapNames.indexOf('player');
		// Game.config.viewBufferMap[Game.toGridPos(Game.player.sprite.x)][Game.toGridPos(Game.player.sprite.y)][0] = -1;
		// Game.config.viewBufferMap[Game.toGridPos(newPosition.x)][Game.toGridPos(newPosition.y)][0] = Game.mapNames.indexOf('player');

		if(Game.phaser.math.distance(newPosition.x, newPosition.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) < Game.blockPx + 10){
			Game.notify('Open to connect\nto Spaceco', 4);
		}
		else{
			var tradePlayer, playerNames = Object.keys(Game.players);

			for(var x = 0; x < playerNames.length; x++){
				if(playerNames[x] === Game.player.name) continue;

				var player_x = Game.players[playerNames[x]];
				if(newPosition.x === player_x.x && newPosition.y === player_x.y) tradePlayer = playerNames[x];
			}

			if(!tradePlayer && Game.hud.isOpen) Game.hud.close();

			else if(tradePlayer) Game.notify('Open your console to trade\nwith '+ tradePlayer, 2);
		}

		if(!direction.includes('teleport') && Game.config.mode === 'normal'){
			Game.player.fuel -= moveTime * 0.0001;

			if(Game.player.fuel < 1.5) Game.notify('Your fuel is running low');
		}

		if(Game.player.hull.space < 1.5){
			if(!Game.hullWarning_TO){
				Game.hullWarning_TO = setTimeout(function(){
					Game.notify('Your Hull is almost full');
				}, 2000);
			}
		}

		setTimeout(function(){
			Game.hud.update();

			if(Game.player.sprite.emitter){
				Game.player.sprite.emitter.destroy();
				Game.player.sprite.emitter = null;
			}
		}, moveTime + 150);
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
				Game.notify('You have already placed a charge');

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

					Game.phaser.camera.shake(Game.player.activeChargeType.includes('remote') ? 0.05 : 0.03, 1000);

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

				Game.phaser.camera.shake(Game.player.activeChargeType.includes('remote') ? 0.05 : 0.03, 1000);

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

	Game.player.hurt = function(amount, by){
		if(Game.player.justHurt) return; //todo make this depend on what the damage is from
		Game.player.justHurt = true;
		Game.player.justHurt_TO = setTimeout(function(){ Game.player.justHurt = false; }, 500);

		Game.player.health -= amount;

		if(Game.player.health <= 0){
			Game.player.sprite.kill();

			// Game.setMapPos({ x: Game.player.sprite.x, y: Game.player.sprite.y }, -1);

			Game.loseReason = by;
			Game.phaser.time.events.add(200, function(){ Game.phaser.state.start('end'); });
		}
		else if(Game.player.health <= 25){
			Game.notify('Your health is running low');
		}

		Game.hud.update();
	};

	Game.player.openTrade = function(tradePlayerName){
		if(Game.hud.isOpen) return;

		Game.hud.open('trade');

		var tradePlayer = Game.players[tradePlayerName];

		var menu = '	 Trade	 For		 Accept\n';

		Game.hud.interfaceText.setText('						PLAYER TRADE				Exit\n'+ menu);

		Game.offer = {};
		Game.offer_sent_accept = Game.offer_accepted = 0;
		Game.tradePlayerName = tradePlayerName;

		Game.hud.view = 'for';
	};

	Game.player.handlePointer = function(pointer){
		if(Game.hud.isOpen !== 'trade') return;

		// return console.log(pointer.x, pointer.y);

		if(pointer.y > 20 && pointer.y < 80 && pointer.x > 460 && pointer.x < 560){
			Log()('exit');
			return Game.hud.close();
		}

		if(pointer.y > 70 && pointer.y < 105){// menu
			if(pointer.x > 60 && pointer.x < 160){
				Log()('trade');
				if(Game.hud.view === 'trade' && Object.keys(Game.player.inventory).length > 7) Game.player.setView('trade_pg2');
				else if(Game.hud.view === 'trade_pg2' && Object.keys(Game.player.inventory).length > 14) Game.player.setView('trade_pg3');
				else Game.player.setView('trade');
			}
			else if(pointer.x > 170 && pointer.x < 250){
				Log()('for');
				if(Game.hud.view === 'for' && Object.keys(Game.offer).length > 7) Game.player.setView('for_pg2');
				else if(Game.hud.view === 'for_pg2' && Object.keys(Game.offer).length > 14) Game.player.setView('for_pg3');
				else Game.player.setView('for');
			}
			else if(pointer.x > 290 && pointer.x < 400){
				Log()('accept');
				Game.player.setView('accept');
			}
		}

		if(Game.hud.view !== 'trade') return;
		var selectedItem, pageIndexMod = (parseInt(Game.hud.view.replace(/.*_pg?/, '')) || 0) * 6;

		if(pointer.y > 110 && pointer.y < 140){
			selectedItem = Game.hud.inventoryItemNames[pageIndexMod + 0];
		}

		else if(pointer.y > 150 && pointer.y < 180){
			selectedItem = Game.hud.inventoryItemNames[pageIndexMod + 1];
		}

		else if(pointer.y > 190 && pointer.y < 220){
			selectedItem = Game.hud.inventoryItemNames[pageIndexMod + 2];
		}

		else if(pointer.y > 230 && pointer.y < 260){
			selectedItem = Game.hud.inventoryItemNames[pageIndexMod + 3];
		}

		else if(pointer.y > 270 && pointer.y < 300){
			selectedItem = Game.hud.inventoryItemNames[pageIndexMod + 4];
		}

		else if(pointer.y > 310 && pointer.y < 340){
			selectedItem = Game.hud.inventoryItemNames[pageIndexMod + 5];
		}

		Game.player.selectItem(selectedItem, Game.hud.view, pointer);
	};

	Game.player.setView = function(view){
		if(Game.hud.isOpen !== 'trade') return;

		if(Game.hud.justSetView) return;
		Game.hud.justSetView = true;
		Game.hud.justSetView_TO = setTimeout(function(){ Game.hud.justSetView = false; }, 400);

		Game.hud.view = view;

		var menu = '';
		var items = '';
		var shortestLength = 10;
		var space = 19;
		var x, itemName, offered, leftAlignLineItem;

		Game.tradeOffer = Game.tradeOffer || {};

		var inventoryItemNames = Game.hud.inventoryItemNames = Object.keys(Game.player.inventory), inventoryItemCount = inventoryItemNames.length;
		var offerItemNames = Game.hud.offerItemNames = Object.keys(Game.tradeOffer), offerItemCount = offerItemNames.length;

		if(view === 'trade'){
			menu = '	['+ (inventoryItemCount > 7 ? ' pg1 ' : 'Trade') +']	For		 Accept\n';

			for(x = 0; x < Math.min(7, inventoryItemCount); x++){
				itemName = inventoryItemNames[x];
				offered = Game.offer[itemName] || 0;

				leftAlignLineItem = '['+ offered +'] '+ itemName;

				items += leftAlignLineItem + (' '.repeat(leftAlignLineItem.length > shortestLength ? space - (leftAlignLineItem.length - shortestLength) : space)) + Game.player.inventory[itemName] +'\n';
			}

			if(inventoryItemCount === 0) items = 'no items';
		}
		else if(view === 'trade_pg2'){
			menu = '	[ pg2 ]	For		 Accept\n';

			for(x = 7; x < Math.min(14, inventoryItemCount); x++){
				itemName = inventoryItemNames[x];
				offered = Game.offer[itemName] || 0;

				leftAlignLineItem = '['+ offered +'] '+ itemName;

				items += leftAlignLineItem + (' '.repeat(leftAlignLineItem.length > shortestLength ? space - (leftAlignLineItem.length - shortestLength) : space)) + Game.player.inventory[itemName] +'\n';
			}
		}
		else if(view === 'trade_pg3'){
			menu = '	[ pg3 ]	For		 Accept\n';

			for(x = 14; x < inventoryItemCount; x++){
				itemName = inventoryItemNames[x];
				offered = Game.offer[itemName] || 0;

				leftAlignLineItem = '['+ offered +'] '+ itemName;

				items += leftAlignLineItem + (' '.repeat(leftAlignLineItem.length > shortestLength ? space - (leftAlignLineItem.length - shortestLength) : space)) + Game.player.inventory[itemName] +'\n';
			}
		}
		else if(view === 'for'){
			menu = '	 Trade	['+ (offerItemCount > 7 ? 'pg1' : 'For') +']		Accept\n';

			for(x = 0; x < Math.min(7, offerItemCount); x++){
				itemName = offerItemNames[x];

				items += '['+ Game.tradeOffer[itemName] +'] '+ itemName +'\n';
			}

			if(offerItemCount === 0) items = 'no items';
		}
		else if(view === 'for_pg2'){
			menu = '	 Trade	[pg2]		Accept\n';

			for(x = 7; x < Math.min(14, offerItemCount); x++){
				itemName = offerItemNames[x];

				items += '['+ Game.tradeOffer[itemName] +'] '+ itemName +'\n';
			}
		}
		else if(view === 'for_pg3'){
			menu = '	 Trade	[pg3]		Accept\n';

			for(x = 14; x < offerItemCount; x++){
				itemName = offerItemNames[x];

				items += '['+ Game.tradeOffer[itemName] +'] '+ itemName +'\n';
			}
		}
		else if(view === 'accept'){
			menu = '	 Trade	 For		[Accept]\n';

			Game.offer_sent_accept = 1;

			// Socket.active.emit('offer', { to: Game.tradePlayerName, accept: 1 });

			Game.hud.bottomLine.setText('');

			if(Game.offer_accepted){
				var itemNames = Object.keys(Game.tradeOffer);

				for(x = 0; x < itemNames.length; x++){
					Game.player.inventory[itemNames[x]] = Game.player.inventory[itemNames[x]] || 0;

					Game.player.inventory[itemNames[x]] += Game.tradeOffer[itemNames[x]];
				}

				itemNames = Object.keys(Game.offer);

				for(x = 0; x < itemNames.length; x++){
					Game.player.inventory[itemNames[x]] -= Game.offer[itemNames[x]];

					if(Game.player.inventory[itemNames[x]] <= 0) delete Game.player.inventory[itemNames[x]];
				}

				Game.offer = {};
				Game.tradeOffer = {};
				Game.offer_sent_accept = Game.offer_accepted = 0;

				setTimeout(function(){
					Game.player.setView('trade');
				}, 800);
			}
			else Game.hud.view = 'for';
		}

		Game.hud.interfaceText.setText('						PLAYER TRADE				Exit\n'+ menu + items);
	};

	Game.player.selectItem = function(item, view, pointer){
		if(!item) return;

		if(Game.hud.justSelectedItem) return;
		Game.hud.justSelectedItem = true;
		Game.hud.justSelectedItem_TO = setTimeout(function(){ Game.hud.justSelectedItem = false; }, 400);

		Game.offer[item] = Game.offer[item] || 0;

		if(pointer.x < 420) Game.offer[item]++;
		else Game.offer[item]--;

		if(Game.offer[item] > Game.player.inventory[item] || Game.offer[item] < 0) Game.offer[item] = 0;

		if(Game.offer[item] === 0) delete Game.offer[item];

		// Socket.active.emit('offer', { to: Game.tradePlayerName, offer: Game.offer });

		Game.offer_accepted = Game.offer_sent_accept = 0;

		Game.hud.bottomLine.setText('');

		Game.player.setView(view);
	};

	Game.hud = Game.entities.hud.create(0, 0);

	Game.hud.headingText = '						CONSOLE\n';

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
			else if(item === 'health') statusText += Game.toFixed(Game.player.health, 2);
			else if(item === 'fuel') statusText += Game.toFixed(Game.player.fuel, 2);
			else if(item === 'credits') statusText += Game.toFixed(Game.player.credits, 2);
			else if(item === 'hull') statusText += Game.toFixed(Game.player.hull.space, 2);
			else{
				if(item.startsWith('mineral') && Game.player.hull.items[item]) statusText += Game.player.hull.items[item];
			}
		}

		Game.hud.statusText.setText(statusText);
	};

	Game.hud.open = function(name){
		Game.hud.clear();

		if(name === 'hud') Game.hud.openHud();
		else if(name === 'briefing'){
			name = 'hud';

			Game.hud.openBriefing();
		}

		Game.hud.isOpen = name || 'unnamed';

		var scale = { x: 1.79, y: 1.79 };

		Game.phaser.add.tween(Game.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
	};

	Game.hud.open2 = function(opts){
		Game.hud.clear();

		Game.hud.isOpen = opts.name || 'unnamed';

		opts.heading = opts.heading || '';
		opts.menuItems = opts.menuItems || [];
		opts.pageItems = opts.pageItems || [];

		var x, text = '', spacer, pageItemCount = Math.min(7, opts.pageItems.length), splitPageItem, pageItem, pageItemPrice;

		text += ' '.repeat(18 - (opts.heading.length / 2)) + opts.heading + ' '.repeat(14 - (opts.heading.length / 2)) +'EXIT\n';

		for(x = 0; x < 4; ++x){
			if(!opts.menuItems[x]) continue;

			spacer = ' '.repeat(4 - (opts.menuItems[x].length / 2));
			text += spacer + Cjs.capitalize(opts.menuItems[x]) + spacer + (x === 3 ? '\n' : '');
		}

		for(x = 0; x < pageItemCount; ++x){
			splitPageItem = opts.pageItems[x].split(':~:');
			pageItem = Cjs.capitalize(splitPageItem[0]);
			pageItemPrice = splitPageItem[1];

			text += pageItem;

			if(pageItemPrice){
				spacer = ' '.repeat(31 - pageItem.length);
				text += spacer + pageItemPrice;
			}

			text += '\n';
		}

		Game.hud.interfaceText.setText(text);

		var scale = { x: 1.79, y: 1.79 };

		Game.phaser.add.tween(Game.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
	};

	Game.hud.close = function(){
		Game.hud.isOpen = false;

		if(Game.hud.briefingOpen) Game.hud.briefingOpen = false;

		if(Game.hud.emitter){
			Game.hud.emitter.destroy();
			Game.hud.emitter = null;
		}

		Game.hud.interfaceText.setText('');
		Game.hud.bottomLine.setText('');

		Game.phaser.add.tween(Game.hud.scale).to({ x: 0.5, y: 0.5 }, 600, Phaser.Easing.Circular.Out, true);

		Game.hud.update();
	};

	Game.hud.clear = function(){
		Game.hud.statusText.setText('');
		Game.hud.interfaceText.setText('');
	};

	Game.hud.openHud = function(){
		Game.hud.interfaceText.setText(Game.hud.headingText +'	Inventory	Hull			Exit\n');
	};

	Game.hud.openBriefing = function(){
		Game.hud.briefingOpen = true;

		Game.hud.interfaceText.setText(Game.hud.headingText +'	Briefing	 Help			Exit\n');
	};

	Game.hud.setView = function(view){
		if(Game.hud.justSetView) return;
		Game.hud.justSetView = true;
		Game.hud.justSetView_TO = setTimeout(function(){ Game.hud.justSetView = false; }, 400);

		Game.hud.view = view;

		var menu = '';
		var items = '';
		var shortestLength = 5;
		var space = 20;
		var x, itemName, slot;

		var inventoryItemNames = Game.hud.inventoryItemNames = Object.keys(Game.player.inventory), inventoryItemCount = inventoryItemNames.length;
		var hullItemNames = Game.hud.hullItemNames = Object.keys(Game.player.hull.items), hullItemCount = hullItemNames.length;

		if(view === 'briefing'){
			menu = ' [Briefing]	Help			Exit\n';

			items = Game.config.world.briefing;
		}

		if(view === 'help'){
			menu = '	Briefing	[Help]		 Exit\n';

			items = ' Tap the HUD to open your console\n	 Tap Item Slots to use items\n	 Dig until your hull is full\n Then take your load to spaceco\nWhile you\'re there buy some stuff';
		}

		if(view === 'inventory'){
			menu = ' ['+ (inventoryItemCount > 7 ? '	 pg1	 ' : 'Inventory') +'] Hull			Exit\n';

			for(x = 0; x < Math.min(7, inventoryItemCount); x++){
				itemName = inventoryItemNames[x];
				slot = Game.itemSlot1.item === itemName ? 1 : Game.itemSlot2.item === itemName ? 2 : ' ';

				items += '['+ slot +'] '+ itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.player.inventory[itemName] +'\n';
			}
		}
		else if(view === 'inventory_pg2'){
			menu = ' [	 pg2	 ] Hull			Exit\n';

			for(x = 7; x < Math.min(14, inventoryItemCount); x++){
				itemName = inventoryItemNames[x];
				slot = Game.itemSlot1.item === itemName ? 1 : Game.itemSlot2.item === itemName ? 2 : ' ';

				items += '['+ slot +'] '+ itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.player.inventory[itemName] +'\n';
			}
		}
		else if(view === 'inventory_pg3'){
			menu = ' [	 pg3	 ] Hull			Exit\n';

			for(x = 14; x < inventoryItemCount; x++){
				itemName = inventoryItemNames[x];
				slot = Game.itemSlot1.item === itemName ? 1 : Game.itemSlot2.item === itemName ? 2 : ' ';

				items += '['+ slot +'] '+ itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.player.inventory[itemName] +'\n';
			}
		}
		else if(view === 'hull'){
			menu = '	Inventory ['+ (hullItemCount > 6 ? ' p1 ' : 'Hull') +']		 Exit\n';

			items += 'Hull Space							 '+ Game.toFixed(Game.player.hull.space, 2) +'\n';

			for(x = 0; x < Math.min(6, hullItemCount); x++){
				itemName = hullItemNames[x];

				items += itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.player.hull.items[itemName] +'\n';
			}
		}
		else if(view === 'hull_p2'){
			menu = '	Inventory [ p2 ]		 Exit\n';

			for(x = 6; x < Math.min(13, hullItemCount); x++){
				itemName = hullItemNames[x];

				items += itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.player.hull.items[itemName] +'\n';
			}
		}
		else if(view === 'hull_p3'){
			menu = '	Inventory [ p3 ]		 Exit\n';

			for(x = 13; x < hullItemCount; x++){
				itemName = hullItemNames[x];

				items += itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.player.hull.items[itemName] +'\n';
			}
		}

		Game.hud.interfaceText.setText('						CONSOLE\n'+ menu + items);
	};

	Game.hud.handlePointer = function(pointer){
		if(Game.hud.isOpen !== 'hud') return;

		if(pointer.y > 70 && pointer.y < 105){// menu
			if(pointer.x > 50 && pointer.x < 210){
				if(Game.hud.briefingOpen){
					Log()('briefing');
					Game.hud.setView('briefing');
				}
				else{
					Log()('inventory');
					if(Game.hud.view === 'inventory' && Object.keys(Game.player.inventory).length > 7) Game.hud.setView('inventory_pg2');
					else if(Game.hud.view === 'inventory_pg2' && Object.keys(Game.player.inventory).length > 14) Game.hud.setView('inventory_pg3');
					else Game.hud.setView('inventory');
				}
			}
			else if(pointer.x > 220 && pointer.x < 300){
				if(Game.hud.briefingOpen){
					Log()('help');
					Game.hud.setView('help');
				}
				else{
					Log()('hull');

					if(Game.hud.view === 'hull' && Object.keys(Game.player.hull.items).length > 6) Game.hud.setView('hull_p2');
					else if(Game.hud.view === 'hull_p2' && Object.keys(Game.player.hull.items).length > 13) Game.hud.setView('hull_p3');
					else Game.hud.setView('hull');
				}
			}
			else if(pointer.x > 360 && pointer.x < 500){
				Log()('exit');
				Game.hud.close();
			}
		}

		var selectedItem;

		if(pointer.y > 110 && pointer.y < 140){
			if(Game.hud.view === 'inventory'){
				selectedItem = Game.hud.inventoryItemNames[0];
			}
		}

		else if(pointer.y > 150 && pointer.y < 180){
			if(Game.hud.view === 'inventory'){
				selectedItem = Game.hud.inventoryItemNames[1];
			}
		}

		else if(pointer.y > 190 && pointer.y < 220){
			if(Game.hud.view === 'inventory'){
				selectedItem = Game.hud.inventoryItemNames[2];
			}
		}

		else if(pointer.y > 230 && pointer.y < 260){
			if(Game.hud.view === 'inventory'){
				selectedItem = Game.hud.inventoryItemNames[3];
			}
		}

		else if(pointer.y > 270 && pointer.y < 300){
			if(Game.hud.view === 'inventory'){
				selectedItem = Game.hud.inventoryItemNames[4];
			}
		}

		else if(pointer.y > 310 && pointer.y < 340){
			if(Game.hud.view === 'inventory'){
				selectedItem = Game.hud.inventoryItemNames[5];
			}
		}

		Game.hud.selectItem(selectedItem);
	};

	Game.hud.selectItem = function(item){
		if(!item) return;

		if(Game.hud.justSelectedItem) return;
		Game.hud.justSelectedItem = true;
		Game.hud.justSelectedItem_TO = setTimeout(function(){ Game.hud.justSelectedItem = false; }, 400);

		var slot = Game.itemSlot1.item === item ? 2 : Game.itemSlot2.item === item ? -1 : 1;

		if(Game.itemSlot1.item === item) Game.entities.itemSlot.setItem(1, '');
		if(Game.itemSlot2.item === item) Game.entities.itemSlot.setItem(2, '');

		if(slot > 0){
			if(Game['itemSlot'+ slot].item && !Game['itemSlot'+ (slot === 1 ? 2 : 1)].item) slot = slot === 1 ? 2 : 1;
			else if(Game['itemSlot'+ slot].item) Game.entities.itemSlot.setItem(slot, '');

			Game.entities.itemSlot.setItem(slot, item);
		}

		Game.hud.setView('inventory');
	};

	Game.spaceco.headingText = '						 SPACECO						Exit\n';

	Game.spaceco.setInterfaceText = function(text){
		Game.hud.interfaceText.setText(Game.spaceco.headingText + text);
	};

	Game.spaceco.welcome = function(cb){
		// Game.spaceco.setInterfaceText('\n\n Welcome to Spaceco, we love you');

		Game.hud.open2({
			name: 'spaceco',
			pageItems: ['Welcome to Spaceco, we love you']
		});

		setTimeout(cb, 1500);
	};

	Game.spaceco.boot = function(cb){
		if(Game.hud.isOpen !== 'spaceco') return;

		// Game.spaceco.setInterfaceText('\n				Im sorry, but...\n			if you have no money\n		we simply cant help you.');

		Game.hud.open2({
			name: 'spaceco',
			pageItems: ['Im sorry, but...', 'if you have no money', 'we simply cant help you.']
		});

		setTimeout(Game.hud.close, 3 * 1000);
	};

	Game.spaceco.getValue = function(name){
		var value;

		if(name.startsWith('ground')){
			value = Game.config.baseGroundValue + (((Game.config.digTime[name.replace('ground_', '')] / 2) - (Game.spaceco.resourceBay[name] || 0)) / 1000);

			if(name === 'ground_green' && Game.config.mode === 'normal') value *= 2;
		}
		else if(name.startsWith('mineral')){
			value = Game.config.mineralValues[name.replace('mineral_', '')] - ((Game.spaceco.resourceBay[name] || 0) / 40);
		}

		return Math.max(0, value);
	};

	Game.spaceco.open = function(){
		if(Game.hud.isOpen) return;

		Game.spaceco.welcome(function(){
			// var menu = '	 Rates	 Fuel	 Parts	 Shop\n';
			var pageItem = '';
			var output = {
				name: 'spaceco',
				heading: 'SPACECO',
				menuItems: ['rates', 'fuel', 'parts', 'shop'],
				pageItems: []
			};

			if(Game.config.mode === 'normal'){
				delete Game.player.hull.space;

				var hullItemNames = Object.keys(Game.player.hull.items);
				var statingCredits = Game.player.credits;
				var soldItems = {
					ground: 0,
					mineral: 0
				};
				var x;

				for(x = 0; x < hullItemNames.length; x++){
					Game.spaceco.resourceBay[hullItemNames[x]] = Game.spaceco.resourceBay[hullItemNames[x]] || 0;
					Game.spaceco.resourceBay[hullItemNames[x]] += Game.player.hull.items[hullItemNames[x]];

					var type = hullItemNames[x].replace(/_.*$/, '');
					soldItems[type] += Game.player.hull.items[hullItemNames[x]];

					// if(Game.player.hull.items[hullItemNames[x]] > 0) pageItem += hullItemNames[x] +': '+ Game.player.hull.items[hullItemNames[x]] +' * '+ Game.spaceco.getValue(hullItemNames[x]) +'\n';

					Game.player.credits += Game.player.hull.items[hullItemNames[x]] * Game.spaceco.getValue(hullItemNames[x]);
				}

				output.pageItems.push('Sold:');

				var soldItemNames = Object.keys(soldItems);

				for(x = 0; x < soldItemNames.length; ++x){
					output.pageItems.push(' '+ soldItems[soldItemNames[x]] +' x '+ soldItemNames[x] +'s');
				}

				output.pageItems.push('For '+ Game.toFixed(Game.player.credits - statingCredits, 2) +' credits');

				Game.player.hull = {
					items: []
				};
				Game.player.hull.space = 10 * ((Game.player.upgrade || 0) + 1);

				if(Game.player.credits - 0.1 < 0){
					Game.spaceco.getOut_TO = setTimeout(Game.spaceco.boot, 30*1000);
				}
			}

			Game.hud.open2(output);

			Game.hud.bottomLine.setText('...');

			// Game.spaceco.setInterfaceText(menu + pageItem);

			setTimeout(function(){
				Game.spaceco.updateBottomLine();
			}, 500);
		});
	};

	Game.spaceco.setView = function(view){
		if(Game.hud.isOpen !== 'spaceco') return;

		if(Game.hud.justSetView) return;
		Game.hud.justSetView = true;
		Game.hud.justSetView_TO = setTimeout(function(){ Game.hud.justSetView = false; }, 400);

		Game.hud.view = view;

		Game.spaceco.updateBottomLine();

		var menu = '';
		var items = '';
		var leftSpace = 30;
		var mineralNames, x, itemName;

		var partNames = Object.keys(Game.spaceco.parts), partCount = partNames.length;

		if(view === 'rates'){
			menu = '	[ pg1 ]	Fuel	 Parts	 Shop\n';

			mineralNames = ['ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue'];

			for(x = 0; x < mineralNames.length; x++){
				itemName = mineralNames[x];

				items += itemName + (' '.repeat(leftSpace - itemName.length)) +'$'+ Game.spaceco.getValue(itemName).toFixed(2) +'\n';
			}
		}
		else if(view === 'rates_pg2'){
			menu = '	[ pg2 ]	Fuel	 Parts	 Shop\n';

			mineralNames = ['ground_purple', 'ground_pink', 'ground_black'];

			for(x = 0; x < mineralNames.length; x++){
				itemName = mineralNames[x];

				items += itemName + (' '.repeat(leftSpace - itemName.length)) +'$'+ Game.spaceco.getValue(itemName).toFixed(2) +'\n';
			}
		}
		else if(view === 'rates_pg3'){
			menu = '	[ pg3 ]	Fuel	 Parts	 Shop\n';

			mineralNames = ['mineral_green', 'mineral_blue', 'mineral_red', 'mineral_purple', 'mineral_teal', 'mineral_???'];

			for(x = 0; x < mineralNames.length; x++){
				itemName = mineralNames[x];

				items += itemName + (' '.repeat(leftSpace - itemName.length)) +'$'+ Game.spaceco.getValue(itemName).toFixed(2) +'\n';
			}
		}
		else if(view === 'fuel'){
			menu = '	 Rates	[Fuel]	Parts	 Shop';

			items += '\nGas													$'+ Game.config.spacecoPrices.gas;
			items += '\nEnergy											 $'+ Game.config.spacecoPrices.energy;
			items += '\nSuper Oxygen Liquid Nitrogen $'+ Game.config.spacecoPrices.super_oxygen_liquid_nitrogen;
		}
		else if(view === 'parts'){
			menu = '	 Rates	 Fuel	['+ (partCount > 7 ? ' pg1 ' : 'Parts') +']	Shop';

			for(x = 0; x < Math.min(7, partCount); x++){
				itemName = partNames[x];

				items += '\n'+ itemName + (' '.repeat(leftSpace - itemName.length)) +'$'+ Game.spaceco.parts[itemName];
			}

			if(partCount === 0) items = 'no parts';
		}
		else if(view === 'parts_pg2'){
			menu = '	 Rates	 Fuel	[ pg2 ]	Shop';

			for(x = 7; x < Math.min(14, partCount); x++){
				itemName = partNames[x];

				items += '\n'+ itemName + (' '.repeat(leftSpace - itemName.length)) +'$'+ Game.spaceco.parts[itemName];
			}
		}
		else if(view === 'parts_pg3'){
			menu = '	 Rates	 Fuel	[ pg3 ]	Shop';

			for(x = 14; x < partCount; x++){
				itemName = partNames[x];

				items += '\n'+ itemName + (' '.repeat(leftSpace - itemName.length)) +'$'+ Game.spaceco.parts[itemName];
			}
		}
		else if(view === 'shop'){
			menu = '	 Rates	 Fuel	 Parts	[ p1 ]';

			items += '\nTeleporter									 $'+ Game.config.spacecoPrices.teleporter;
			items += '\nResponder Teleporter				 $'+ Game.config.spacecoPrices.responder_teleporter;
			items += '\nRepair											 $'+ Game.config.spacecoPrices.repair;
			items += '\nTransport										$'+ Game.config.spacecoPrices.transport;
		}
		else if(view === 'shop_p2'){
			menu = '	 Rates	 Fuel	 Parts	[ p2 ]';

			items += '\nTimed Charge								 $'+ Game.config.spacecoPrices.timed_charge;
			items += '\nRemote Charge								$'+ Game.config.spacecoPrices.remote_charge;
			items += '\nTimed Freeze Charge					$'+ Game.config.spacecoPrices.timed_freeze_charge;
			items += '\nRemote Freeze Charge				 $'+ Game.config.spacecoPrices.remote_freeze_charge;
		}

		Game.spaceco.setInterfaceText(menu + items);
	};

	Game.spaceco.updateBottomLine = function(){
		if(Game.hud.isOpen !== 'spaceco') return;

		var credits = Game.toFixed(Game.player.credits, 1);
		var fuel = Game.toFixed(Game.player.fuel, 1);
		var health = Game.toFixed(Game.player.health, 1);

		var creditsText = ' '.repeat(7 - (credits.length / 2)) +'$:'+ credits;
		var fuelText = ' '.repeat(7 - (fuel.length / 2)) +'Fuel:'+ fuel;
		var healthText = ' '.repeat(7 - (health.length / 2)) +'Health:'+ health;

		Game.hud.bottomLine.setText(creditsText + fuelText + healthText);
	};

	Game.spaceco.handlePointer = function(pointer){
		if(Game.hud.isOpen !== 'spaceco') return;

		if(pointer.y > 70 && pointer.y < 105){// menu
			if(pointer.x > 60 && pointer.x < 165){
				if(Game.hud.view === 'rates') Game.spaceco.setView('rates_pg2');
				if(Game.hud.view === 'rates_pg2') Game.spaceco.setView('rates_pg3');
				else Game.spaceco.setView('rates');
			}
			else if(pointer.x > 175 && pointer.x < 255){
				Game.spaceco.setView('fuel');
			}
			else if(pointer.x > 275 && pointer.x < 370){
				if(Game.hud.view === 'parts') Game.spaceco.setView('parts_pg2');
				if(Game.hud.view === 'parts_pg2') Game.spaceco.setView('parts_pg3');
				else Game.spaceco.setView('parts');
			}
			else if(pointer.x > 385 && pointer.x < 470){
				if(Game.hud.view === 'shop') Game.spaceco.setView('shop_p2');
				else Game.spaceco.setView('shop');
			}
		}

		var selectedItem;

		if(pointer.y > 110 && pointer.y < 140){
			if(Game.hud.view === 'fuel'){
				selectedItem = 'gas';
			}
			else if(Game.hud.view === 'shop'){
				selectedItem = 'teleporter';
			}
			else if(Game.hud.view === 'shop_p2'){
				selectedItem = 'timed_charge';
			}
		}

		else if(pointer.y > 150 && pointer.y < 180){
			if(Game.hud.view === 'fuel'){
				selectedItem = 'energy';
			}
			else if(Game.hud.view === 'shop'){
				selectedItem = 'responder_teleporter';
			}
			else if(Game.hud.view === 'shop_p2'){
				selectedItem = 'remote_charge';
			}
		}
		else if(pointer.y > 190 && pointer.y < 220){
			if(Game.hud.view === 'fuel'){
				selectedItem = 'super_oxygen_liquid_nitrogen';
			}
			else if(Game.hud.view === 'shop'){
				selectedItem = 'repair';
			}
			else if(Game.hud.view === 'shop_p2'){
				selectedItem = 'timed_freeze_charge';
			}
		}

		else if(pointer.y > 230 && pointer.y < 260){
			if(Game.hud.view === 'shop'){
				selectedItem = 'upgrade';
			}
			else if(Game.hud.view === 'shop_p2'){
				selectedItem = 'remote_freeze_charge';
			}
		}

		else if(pointer.y > 270 && pointer.y < 300){
			if(Game.hud.view === 'shop'){
				selectedItem = 'transport';
			}
		}

		if(selectedItem){
			Game.spaceco.selectItem(selectedItem);
		}
	};

	Game.spaceco.selectItem = function(item){
		if(!item) return;

		var isFuel = (item === 'gas' || item === 'energy' || item === 'super_oxygen_liquid_nitrogen'), canUse = true;

		if(Game.hud.justSelectedItem) return;
		Game.hud.justSelectedItem = true;

		var bottomLineUpdate;

		if(Game.player.credits < Game.config.spacecoPrices[item]){
			canUse = false;
			bottomLineUpdate ='			 Not enough credits!';
		}
		else if(item === 'repair' && Game.player.health === 100 + (20 * ((Game.player.upgrade || 0) + 1))){
			canUse = false;
			bottomLineUpdate ='					Full health!';
		}
		else if(item === 'upgrade' && Game.player.upgrade === 3){
			canUse = false;
			bottomLineUpdate ='				 Fully upgraded!';
		}
		else if(item === 'gas' && Game.player.upgrade > 1){
			canUse = false;
			bottomLineUpdate ='					Cant use gas!';
		}
		else if(item === 'energy' && Game.player.upgrade !== 2){
			canUse = false;
			bottomLineUpdate ='				Cant use energy!';
		}
		else if(item === 'super_oxygen_liquid_nitrogen' && Game.player.upgrade !== 3){
			canUse = false;
			bottomLineUpdate ='				 Cant use SOLN!';
		}
		else if(isFuel && Game.player.fuel > 10 + (10 * ((Game.player.upgrade || 0) + 1))){
			canUse = false;
			bottomLineUpdate ='					Fuel is full!';
		}

		var timeout = isFuel && canUse ? 250 : 800;

		Game.hud.justSelectedItem_TO = setTimeout(function(){ Game.hud.justSelectedItem = false; }, timeout);

		if(!bottomLineUpdate && Game.config.spacecoPrices[item]){
			bottomLineUpdate = Game.capitalize(item.replace('super_oxygen_liquid_nitrogen', 'SOLN'), 1, '_') +' : '+ Game.config.spacecoPrices[item] + (isFuel ? ' (Hold to fill)' : '');

			Game.player.credits -= Game.config.spacecoPrices[item];

			if(item === 'gas'){
				if(Game.player.upgrade < 2) Game.player.fuel += 1.5;
			}
			else if(item === 'energy'){
				if(Game.player.upgrade === 2) Game.player.fuel += 3.2;
			}
			else if(item === 'super_oxygen_liquid_nitrogen'){
				if(Game.player.upgrade === 3) Game.player.fuel += 6.9;
			}
			else if(item === 'transport'){
				Game.purchasedTransport = true;

				Game.phaser.state.start('play');
			}
			else if(item === 'upgrade'){
				Game.player.upgrade++;

				Game.player.sprite.animations.play('upgrade_'+ Game.player.upgrade);

				Game.player.hull.space = 10 * ((Game.player.upgrade || 0) + 1);
			}
			else if(item === 'repair'){
				Game.player.health = 100 + (20 * ((Game.player.upgrade || 0) + 1));
			}
			else{
				Game.player.inventory[item] = Game.player.inventory[item] || 0;
				Game.player.inventory[item]++;
			}
		}

		if(bottomLineUpdate){
			Game.hud.bottomLine.setText(bottomLineUpdate);

			return setTimeout(Game.spaceco.updateBottomLine, timeout);
		}
	};

	Game.spaceco.hurt = function(amount, by){
		if(Game.spaceco.justHurt) return; //todo make this depend on what the damage is from
		Game.spaceco.justHurt = true;
		Game.spaceco.justHurt_TO = setTimeout(function(){ Game.spaceco.justHurt = false; }, 500);

		Game.spaceco.damage += amount;

		if(Game.spaceco.damage > 9){
			setTimeout(function(){
				Game.spaceco.kill();

				Game.notify('Spaceco was killed by '+ by);
			}, 400);
		}
		else Game.spaceco.sprite.frame = Game.spaceco.damage;
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
		Game.player.sprite.kill();

		// Game.setMapPos({ x: Game.player.sprite.x, y: Game.player.sprite.y }, -1);

		Game.loseReason = 'fuel';
		return Game.phaser.time.events.add(200, function(){ Game.phaser.state.start('end'); }, this);
	}

	if(Game.player.sprite.emitter){
		Game.player.sprite.emitter.forEachAlive(function(particle){
			particle.alpha = Math.max(0, Math.min(1, (particle.lifespan / Game.player.sprite.emitter.lifespan) * 2));
		});
	}

	if(this.input.keyboard.isDown(Phaser.Keyboard.ESC) && !Game.justPressedEsc){
		Game.justPressedEsc = true;
		Game.justPressedEsc_TO = setTimeout(function(){ Game.justPressedEsc = false; }, 1000);

		if(Game.hud.isOpen) Game.hud.close();
		else{
			if(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) < Game.blockPx + 10) Game.spaceco.open();
			else Game.hud.open('hud');
			return;
		}
	}

	Game.lava.forEachAlive(function(lava){
		if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, lava.x, lava.y) < Game.blockPx/2){
			Game.player.hurt(12 + Game.randFloat(1, 6), 'lava');
		}

		if(Game.phaser.math.distance(Game.spaceco.sprite.x, Game.spaceco.sprite.y, lava.x, lava.y) < Game.blockPx){
			Game.spaceco.hurt(1, 'lava');
		}

		Game.monsters.forEachAlive(function(monster){
			if(Game.phaser.math.distance(monster.x, monster.y, lava.x, lava.y) < Game.blockPx){
				monster.kill();

				Game.setMapPos({ x: monster.x, y: monster.y }, -1);
			}
		}, this);
	}, this);

	Game.gas.forEachAlive(function(gas){
		if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, gas.x, gas.y) < Game.blockPx/2){
			Game.player.hurt(10 + Game.randFloat(1, 5), 'gas');
		}

		Game.monsters.forEachAlive(function(monster){
			if(Game.phaser.math.distance(monster.x, monster.y, gas.x, gas.y) < Game.blockPx){
				monster.kill();

				Game.setMapPos({ x: monster.x, y: monster.y }, -1);
			}
		}, this);
	}, this);

	Game.monsters.forEachAlive(function(monster){
		if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, monster.x, monster.y) < Game.blockPx/2){
			Game.player.hurt(5 + Game.randFloat(1, 5), 'monster');
		}
	}, this);

	if(Game.spaceco.damage <= 10 && !Game.phaser.tweens.isTweening(Game.spaceco)){
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
			Game.phaser.add.tween(Game.spaceco).to({ y: Game.spaceco.sprite.y + Game.blockPx }, 500, Phaser.Easing.Sinusoidal.InOut, true);

			Game.spaceco.hurt(1, 'falling');
		}
	}

	if(this.input.activePointer.isDown){
		if(Game.hud.isOpen && !Game.hud.justUsedItemSlot && !Game.phaser.tweens.isTweening(Game.hud.scale)){
			if(this.input.activePointer.x > 575 || this.input.activePointer.y > 460) Game.hud.close();

			else if(Game.hud.isOpen === 'trade') Game.player.handlePointer(this.input.activePointer);

			else if(Game.entities[Game.hud.isOpen] && Game.entities[Game.hud.isOpen].handlePointer) Game.entities[Game.hud.isOpen].handlePointer(this.input.activePointer);

			else Game.hud.close();

			return;
		}

		else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 32) < 32){
			if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;
			Game.hud.justUsedItemSlot = true;
			Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

			if(!Game.itemSlot1.item) Game.hud.open('hud');
			else Game.player.useItem(1, Game.itemSlot1.item);

			return;
		}

		else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 106) < 32){
			if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;
			Game.hud.justUsedItemSlot = true;
			Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

			if(!Game.itemSlot2.item) Game.hud.open('hud');
			else Game.player.useItem(2, Game.itemSlot2.item);

			return;
		}

		else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, 70, 50) < 128){
			if(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) < Game.blockPx + 10) Game.spaceco.open();
			else{
				var tradePlayer, playerNames = Object.keys(Game.players);

				for(var x = 0; x < playerNames.length; x++){
					if(playerNames[x] === Game.player.name) continue;

					var player_x = Game.players[playerNames[x]];
					if(Game.player.sprite.x === player_x.x && Game.player.sprite.y === player_x.y) tradePlayer = playerNames[x];
				}

				if(!tradePlayer) return Game.hud.open('hud');

				Game.player.openTrade(tradePlayer);
			}

			return;
		}
	}

	if(Game.hud.isOpen && !Game.phaser.tweens.isTweening(Game.hud.scale)){
		var selectedItem, selectedMenu;

		if(this.input.keyboard.isDown(Phaser.Keyboard.I) && Game.hud.isOpen === 'hud' && !Game.hud.briefingOpen){
			if(Game.hud.view === 'inventory' && Object.keys(Game.player.inventory).length > 6) selectedMenu = 'inventory_pg2';
			else selectedMenu = 'inventory';
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.H) && Game.hud.isOpen === 'hud' && !Game.hud.briefingOpen){
			if(Game.hud.view === 'hull') selectedMenu = 'hull_p2';
			else if(Game.hud.view === 'hull_p2') selectedMenu = 'hull_p3';
			else selectedMenu = 'hull';
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.R) && Game.hud.isOpen === 'spaceco'){
			if(Game.hud.view === 'rates') selectedMenu = 'rates_pg2';
			else selectedMenu = 'rates';
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.F) && Game.hud.isOpen === 'spaceco'){
			selectedMenu = 'fuel';
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.S) && Game.hud.isOpen === 'spaceco'){
			if(Game.hud.view === 'shop') Game.spaceco.setView('shop_p2');
			else selectedMenu = 'shop';
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.ONE)){
			if(Game.hud.isOpen === 'hud'){
				if(Game.hud.view === 'inventory'){
					selectedItem = Game.hud.inventoryItemNames[0];
				}
			}
			else if(Game.hud.isOpen === 'spaceco'){
				if(Game.hud.view === 'fuel'){
					selectedItem = 'gas';
				}
				else if(Game.hud.view === 'shop'){
					selectedItem = 'teleporter';
				}
				else if(Game.hud.view === 'shop_p2'){
					selectedItem = 'timed_charge';
				}
			}
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.TWO)){
			if(Game.hud.isOpen === 'hud'){
				if(Game.hud.view === 'inventory'){
					selectedItem = Game.hud.inventoryItemNames[1];
				}
			}
			else if(Game.hud.isOpen === 'spaceco'){
				if(Game.hud.view === 'fuel'){
					selectedItem = 'energy';
				}
				else if(Game.hud.view === 'shop'){
					selectedItem = 'responder_teleporter';
				}
				else if(Game.hud.view === 'shop_p2'){
					selectedItem = 'remote_charge';
			}
			}
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.THREE)){
			if(Game.hud.isOpen === 'hud'){
				if(Game.hud.view === 'inventory'){
					selectedItem = Game.hud.inventoryItemNames[2];
				}
			}
			else if(Game.hud.isOpen === 'spaceco'){
				if(Game.hud.view === 'fuel'){
					selectedItem = 'super_oxygen_liquid_nitrogen';
				}
				else if(Game.hud.view === 'shop'){
					selectedItem = 'repair';
				}
				else if(Game.hud.view === 'shop_p2'){
					selectedItem = 'timed_freeze_charge';
				}
			}
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.FOUR)){
			if(Game.hud.isOpen === 'hud'){
				if(Game.hud.view === 'inventory'){
					selectedItem = Game.hud.inventoryItemNames[3];
				}
			}
			else if(Game.hud.isOpen === 'spaceco'){
				if(Game.hud.view === 'shop'){
					selectedItem = 'upgrade';
				}
				else if(Game.hud.view === 'shop_p2'){
					selectedItem = 'remote_freeze_charge';
				}
			}
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.FIVE)){
			if(Game.hud.isOpen === 'hud'){
				if(Game.hud.view === 'inventory'){
					selectedItem = Game.hud.inventoryItemNames[4];
				}
			}
			else if(Game.hud.isOpen === 'spaceco'){
				if(Game.hud.view === 'shop'){
					selectedItem = 'transport';
				}
			}
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.SIX)){
			if(Game.hud.isOpen === 'hud'){
				if(Game.hud.view === 'inventory'){
					selectedItem = Game.hud.inventoryItemNames[5];
				}
			}
		}

		if(selectedItem && Game.entities[Game.hud.isOpen] && Game.entities[Game.hud.isOpen].selectItem){
			Game.entities[Game.hud.isOpen].selectItem(selectedItem);

			return;
		}
		else if(selectedMenu){
			Game.entities[Game.hud.isOpen].setView(selectedMenu);

			return;
		}

		return;
	}

	if(!Game.phaser.tweens.isTweening(Game.player.sprite) && !Game.phaser.tweens.isTweening(Game.hud.scale)){
		var moving;
		var surrounds = Game.player.getSurrounds();

		if(this.input.activePointer.isDown){
			var xDiff = Game.player.sprite.x - this.input.activePointer.x - Game.phaser.camera.x;
			var yDiff = Game.player.sprite.y - this.input.activePointer.y - Game.phaser.camera.y;

			var xDirection = xDiff > 0 ? 'left' : 'right';
			var yDirection = yDiff > 0 ? 'up' : 'down';

			moving = Math.abs(xDiff) > Math.abs(yDiff) ? xDirection : yDirection;
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
		else if(this.input.keyboard.isDown(Phaser.Keyboard.ONE)){
			Game.player.useItem(1, Game.itemSlot1.item);
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.TWO)){
			Game.player.useItem(2, Game.itemSlot2.item);
		}

		if(moving){
			Game.player.move(moving);
		}

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