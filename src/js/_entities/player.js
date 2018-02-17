/* global Phaser, Game, Socket, Log */

Game.entities.player = function(){};

Game.entities.player.create = function(settings, isLocal){
	var playerSprite = Game.phaser.add.sprite(Game.toPx(settings.position.x), Game.toPx(1), 'drill', 15);

	playerSprite.anchor.setTo(0.5, 0.5);

	playerSprite.animations.add('normal', [0, 1, 2], 10, true);
	playerSprite.animations.add('upgrade_1', [3, 4, 5], 10, true);
	playerSprite.animations.add('upgrade_2', [6, 7, 8], 10, true);
	playerSprite.animations.add('upgrade_3', [9, 10, 11], 10, true);
	playerSprite.animations.add('teleporting', [12, 13, 14], 10, true);

	playerSprite.animations.play('normal');

	// Game.config.map[settings.position.x][1][0] = Game.mapNames.indexOf('player');

	Game.config.defaultPlayerScale = playerSprite.scale.x;

	if(isLocal) Game.adjustViewPosition(playerSprite.x - Game.viewWidth / 2, playerSprite.y - Game.viewHeight / 2, Math.ceil(Game.phaser.math.distance(playerSprite.x, playerSprite.y, Game.phaser.camera.x / 2, Game.phaser.camera.y / 2)));

	return playerSprite;
};

Game.entities.player.getSurrounds = function(playerName){
	var player = playerName ? Game.players[playerName].sprite : Game.player.sprite;

	return {
		left: Game.groundAt(player.x - Game.blockPx, player.y),
		farLeft: Game.groundAt(player.x - (Game.blockPx * 2), player.y),
		topLeft: Game.groundAt(player.x - Game.blockPx, player.y - Game.blockPx),
		top: Game.groundAt(player.x, player.y - Game.blockPx),
		topRight: Game.groundAt(player.x + Game.blockPx, player.y - Game.blockPx),
		right: Game.groundAt(player.x + Game.blockPx, player.y),
		farRight: Game.groundAt(player.x + (Game.blockPx * 2), player.y),
		bottomRight: Game.groundAt(player.x + Game.blockPx, player.y + Game.blockPx),
		bottom: Game.groundAt(player.x, player.y + Game.blockPx),
		bottomLeft: Game.groundAt(player.x - Game.blockPx, player.y + Game.blockPx)
	};
};

Game.entities.player.move = function(direction){
	// console.log('Drill: On the move, goin: ', direction);

	var surrounds = Game.entities.player.getSurrounds();

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

	// Socket.active.emit('player_update', { position: newPosition, moveTime: moveTime, direction: direction, invertTexture: invertTexture, angle: Game.player.sprite.angle });

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

		if(!tradePlayer && Game.hud.isOpen) Game.entities.hud.close();

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
		Game.entities.hud.update();

		if(Game.player.sprite.emitter){
			Game.player.sprite.emitter.destroy();
			Game.player.sprite.emitter = null;
		}
	}, moveTime + 150);
};

Game.entities.player.useItem = function(slotNum, item){
	if(Game.entities.player.justUsedItem || !Game['itemSlot'+ slotNum].item || Game['itemSlot'+ slotNum].item === '') return;

	if(Game.entities.player.justUsedItem_TO){
		clearTimeout(Game.entities.player.justUsedItem_TO);
		Game.entities.player.justUsedItem_TO = null;
	}
	if(!Game.entities.player.justUsedItem_TO){
		Game.entities.player.justUsedItem = true;
		Game.entities.player.justUsedItem_TO = setTimeout(function(){
			Game.entities.player.justUsedItem = false;
		}, 500);
	}

	if(item === 'teleporter'){
		Game.entities.player.move('teleport');
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

			Game.entities.player.move('teleport');
		}
		else{
			Game.entities.player.move('responder_teleport');

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

Game.entities.player.hurt = function(amount, by){
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

	Game.entities.hud.update();
};

Game.entities.player.openTrade = function(tradePlayerName){
	if(Game.hud.isOpen) return;

	Game.entities.hud.open('trade');

	var tradePlayer = Game.players[tradePlayerName];

	var menu = '	 Trade	 For		 Accept\n';

	Game.hud.interfaceText.setText('						PLAYER TRADE				Exit\n'+ menu);

	Game.offer = {};
	Game.offer_sent_accept = Game.offer_accepted = 0;
	Game.tradePlayerName = tradePlayerName;

	Game.hud.view = 'for';
};

Game.entities.player.handlePointer = function(pointer){
	if(Game.hud.isOpen !== 'trade') return;

	// return console.log(pointer.x, pointer.y);

	if(pointer.y > 20 && pointer.y < 80 && pointer.x > 460 && pointer.x < 560){
		Log()('exit');
		return Game.entities.hud.close();
	}

	if(pointer.y > 70 && pointer.y < 105){// menu
		if(pointer.x > 60 && pointer.x < 160){
			Log()('trade');
			if(Game.hud.view === 'trade' && Object.keys(Game.player.inventory).length > 7) Game.entities.player.setView('trade_pg2');
			else if(Game.hud.view === 'trade_pg2' && Object.keys(Game.player.inventory).length > 14) Game.entities.player.setView('trade_pg3');
			else Game.entities.player.setView('trade');
		}
		else if(pointer.x > 170 && pointer.x < 250){
			Log()('for');
			if(Game.hud.view === 'for' && Object.keys(Game.offer).length > 7) Game.entities.player.setView('for_pg2');
			else if(Game.hud.view === 'for_pg2' && Object.keys(Game.offer).length > 14) Game.entities.player.setView('for_pg3');
			else Game.entities.player.setView('for');
		}
		else if(pointer.x > 290 && pointer.x < 400){
			Log()('accept');
			Game.entities.player.setView('accept');
		}
	}

	if(Game.hud.view !== 'trade') return;
	var selectedItem, pageIndexMod = (parseInt(Game.hud.view.replace(/.*_pg?/, '')) || 0) * 6;

	if(pointer.y > 110 && pointer.y < 140){
		selectedItem = Game.entities.hud.inventoryItemNames[pageIndexMod + 0];
	}

	else if(pointer.y > 150 && pointer.y < 180){
		selectedItem = Game.entities.hud.inventoryItemNames[pageIndexMod + 1];
	}

	else if(pointer.y > 190 && pointer.y < 220){
		selectedItem = Game.entities.hud.inventoryItemNames[pageIndexMod + 2];
	}

	else if(pointer.y > 230 && pointer.y < 260){
		selectedItem = Game.entities.hud.inventoryItemNames[pageIndexMod + 3];
	}

	else if(pointer.y > 270 && pointer.y < 300){
		selectedItem = Game.entities.hud.inventoryItemNames[pageIndexMod + 4];
	}

	else if(pointer.y > 310 && pointer.y < 340){
		selectedItem = Game.entities.hud.inventoryItemNames[pageIndexMod + 5];
	}

	Game.entities.player.selectItem(selectedItem, Game.hud.view, pointer);
};

Game.entities.player.setView = function(view){
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

	var inventoryItemNames = Game.entities.hud.inventoryItemNames = Object.keys(Game.player.inventory), inventoryItemCount = inventoryItemNames.length;
	var offerItemNames = Game.entities.hud.offerItemNames = Object.keys(Game.tradeOffer), offerItemCount = offerItemNames.length;

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
				Game.entities.player.setView('trade');
			}, 800);
		}
		else Game.hud.view = 'for';
	}

	Game.hud.interfaceText.setText('						PLAYER TRADE				Exit\n'+ menu + items);
};

Game.entities.player.selectItem = function(item, view, pointer){
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

	Game.entities.player.setView(view);
};