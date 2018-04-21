/* global Game, Log, Cjs, WS, Phaser */

Game.entities.player = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'player');

	this.anchor.setTo(0.5, 0.5);

	this.animations.add('normal', [0, 1, 2], 10, true);
	this.animations.add('upgrade_1', [3, 4, 5], 10, true);
	this.animations.add('upgrade_2', [6, 7, 8], 10, true);
	this.animations.add('upgrade_3', [9, 10, 11], 10, true);
	this.animations.add('teleporting', [12, 13, 14], 10, true);
};

Game.entities.player.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.player.prototype.constructor = Game.entities.player;

Game.entities.player.prototype.update = function(){
	if(!Game.initialized) return;

	// if(Game.player.sprite.emitter){// particle decay
	// 	Game.player.sprite.emitter.forEachAlive(function(particle){
	// 		particle.alpha = Math.max(0, Math.min(1, (particle.lifespan / Game.player.sprite.emitter.lifespan) * 2));
	// 	});
	// }
	var spriteGridPos = Game.toGridPos(Game.player.sprite);

	var playerCollision = Game.mapPos(spriteGridPos).ground.name;

	if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && typeof playerCollision === 'string'){
		Log()('playerCollision', playerCollision);

		if(playerCollision === 'lava') Game.effects.hurt('lava', 12, 3);
		else if(playerCollision === 'poisonous_gas') Game.effects.hurt('poisonous_gas', 10, 5);
		else if(playerCollision === 'noxious_gas') Game.effects.disorient(3000);
		else if(playerCollision === 'red_monster') Game.effects.hurt('red_monster', 8, 3);
		else if(playerCollision === 'purple_monster') Game.effects.hurt('purple_monster', 6, 2);
	}

	if(!Game.phaser.tweens.isTweening(Game.player.sprite)){
		var moving, altDirection;
		var surrounds = Game.getSurrounds(Game.toGridPos(Game.player.sprite), undefined, 'ground');
		var hudIsTweening = Game.phaser.tweens.isTweening(Game.hud.scale);

		if(Game.phaser.input.activePointer.isDown){
			if(Game.hud.isOpen){//&& !Game.hud.justUsedItemSlot
				if(!hudIsTweening && (Game.phaser.input.activePointer.x > 575 || Game.phaser.input.activePointer.y > 460)) Game.hud.close();

				else if(!hudIsTweening) Game.hud.handlePointer(Game.phaser.input.activePointer);

				return;
			}

			else if(!Game.hud.isOpen && Game.phaser.math.distance(Game.phaser.input.activePointer.x, Game.phaser.input.activePointer.y, 70, 50) < 128){
				return Game.player.openHUD();
			}

			else if(Game.phaser.math.distance(Game.phaser.input.activePointer.x, Game.phaser.input.activePointer.y, Game.viewWidth - 32, 32) < 32){
				if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;

				Game.hud.justUsedItemSlot = true;
				Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

				if(!Game.itemSlot1.item) Game.hud.open('console');

				else Game.player.useItem(1, Game.itemSlot1.item);

				return;
			}

			else if(Game.phaser.math.distance(Game.phaser.input.activePointer.x, Game.phaser.input.activePointer.y, Game.viewWidth - 32, 106) < 32){
				if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;

				Game.hud.justUsedItemSlot = true;
				Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

				if(!Game.itemSlot2.item) Game.hud.open('console');

				else Game.player.useItem(2, Game.itemSlot2.item);

				return;
			}

			else{
				var xDiff = Game.player.sprite.x - Game.phaser.input.activePointer.x - Game.phaser.camera.x;
				var yDiff = Game.player.sprite.y - Game.phaser.input.activePointer.y - Game.phaser.camera.y;

				var xDirection = xDiff > 0 ? 'left' : 'right';
				var yDirection = yDiff > 0 ? 'up' : 'down';

				Log()(xDiff, yDiff);

				xDiff = Math.abs(xDiff);
				yDiff = Math.abs(yDiff);

				moving = xDiff > yDiff ? (xDiff > 10 ? xDirection : null) : (yDiff > 10 ? yDirection : null);
				altDirection = xDiff > yDiff ? (yDiff > 10 ? yDirection : null) : (xDiff > 10 ? xDirection : null);
			}
		}

		else if(Game.phaser.input.keyboard.isDown(Phaser.Keyboard.ESC) && !Game.justPressedEsc){
			Game.justPressedEsc = true;
			Game.justPressedEsc_TO = setTimeout(function(){ Game.justPressedEsc = false; }, 1000);

			if(Game.hud.isOpen) Game.hud.close();

			else Game.player.openHUD();

			return;
		}

		else if(Game.phaser.input.keyboard.isDown(Phaser.Keyboard.ONE)){
			return Game.player.useItem(1, Game.itemSlot1.item);
		}
		else if(Game.phaser.input.keyboard.isDown(Phaser.Keyboard.TWO)){
			return Game.player.useItem(2, Game.itemSlot2.item);
		}

		else if(Game.phaser.input.keyboard.isDown(Phaser.Keyboard.LEFT) || Game.phaser.input.keyboard.isDown(Phaser.Keyboard.A)){
			moving = 'left';
		}
		else if(Game.phaser.input.keyboard.isDown(Phaser.Keyboard.RIGHT) || Game.phaser.input.keyboard.isDown(Phaser.Keyboard.D)){
			moving = 'right';
		}
		else if(Game.phaser.input.keyboard.isDown(Phaser.Keyboard.DOWN) || Game.phaser.input.keyboard.isDown(Phaser.Keyboard.S)){
			moving = 'down';
		}
		else if(Game.phaser.input.keyboard.isDown(Phaser.Keyboard.UP) || Game.phaser.input.keyboard.isDown(Phaser.Keyboard.W)){
			moving = 'up';
		}

		var canMove;

		if(moving && Game.player.isDisoriented) moving = ['up', 'down', 'left', 'right'][Cjs.randInt(0, 3)];

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

					if(Game.player.lastMove === 'down') Game.effects.hurt('falling', 4, 3);

					Log()('falling');
				}

				Game.player.move(direction);
			}
		}
	}
};

Game.entities.player.create = function(settings){
	var playerSprite = Game.playersGroup.add(new Game.entities.player(settings.position.x, settings.position.y || 1));
	// var playerSprite = Game.phaser.add.sprite(Game.toPx(settings.position.x), Game.toPx(1), 'drill', 15);

	// playerSprite.anchor.setTo(0.5, 0.5);

	// playerSprite.animations.add('normal', [0, 1, 2], 10, true);
	// playerSprite.animations.add('upgrade_1', [3, 4, 5], 10, true);
	// playerSprite.animations.add('upgrade_2', [6, 7, 8], 10, true);
	// playerSprite.animations.add('upgrade_3', [9, 10, 11], 10, true);
	// playerSprite.animations.add('teleporting', [12, 13, 14], 10, true);

	playerSprite.animations.play('normal');

	Game.config.defaultPlayerScale = playerSprite.scale.x;

	// Game.playersGroup.add(playerSprite);

	return playerSprite;
};

Game.entities.player.init = function(){
	Game.player.move = function(direction, surrounds, position){
		Log()('player moving: ', direction);

		if(Game.hud.isOpen) Game.hud.close();

		surrounds = surrounds || Game.getSurrounds(Game.toGridPos(Game.player.sprite));

		var newPosition = {}, newGridPos, newCameraPosition, moveTime, canMove = true;

		if(direction === 'teleport'){
			Game.player.sprite.animations.play('teleporting');

			newPosition = Game.toPx(position);
			newGridPos = Game.toGridPos(newPosition);

			newCameraPosition = { x: newPosition.x - Game.viewWidth / 2, y: newPosition.y - Game.viewHeight / 2 };

			moveTime = Math.ceil(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, newPosition.x, newPosition.y));

			setTimeout(function(){
				Game.player.sprite.animations.play('normal');
			}, 200 + moveTime);
		}

		else{
			newPosition = {
				x: Game.player.sprite.x + (direction === 'left' ? -Game.blockPx : direction === 'right' ? Game.blockPx : 0),
				y: Game.player.sprite.y + (direction === 'up' ? -Game.blockPx : direction === 'down' ? Game.blockPx : 0)
			};

			newGridPos = Game.toGridPos(newPosition);

			var targetGround = Game.mapPos(newGridPos).ground;
			moveTime = targetGround.base === 'ground' ? (Game.config.densities[targetGround.variant] ? Game.config.densities[targetGround.variant] - Game.player.drillSpeedMod : Game.player.baseMoveTime) : Game.player.baseMoveTime;

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

			if(targetGround.base === 'ground'){
				canMove = !Game.config.groundEffects[targetGround.variant].includes('impenetrable');

				Game.entities.ground.dig(newGridPos);

				// Game.player.sprite.emitter = Game.phaser.add.emitter(0, 0, 100);
				// Game.player.sprite.addChild(Game.player.sprite.emitter);

				// var frameMod = Game.entities.ground.types.indexOf(targetGroundType.replace('ground_', '')) * 4;

				// Game.player.sprite.emitter.makeParticles('ground', [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod]);

				// Game.player.sprite.emitter.x = 32;

				// Game.player.sprite.emitter.setScale(0.1, 0.3, 0.1, 0.3);

				// Game.player.sprite.emitter.start(true, canMove ? moveTime + 100 : 150, null, Math.round(Cjs.randInt(3, 7)));
			}

			else if({ lava: 1, gas: 1 }[targetGround.base]){
				Game.entities[targetGround.name].spread(targetGround.sprite);
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

			if(Game.mapPos(newGridPos.x, newGridPos.y).items.names.length) Game.entities.item.interact(newGridPos);

			if(Game.player.hull.space < 0) moveTime += 250;

			moveTime = Math.max(200, moveTime);

			if(!direction.includes('teleport')) Game.effects.useFuel(moveTime * 0.0001, 0.01);

			Game.player.lastMove = direction;

			Game.player.lastPosition = newPosition;

			Game.phaser.add.tween(Game.player.sprite).to(newPosition, moveTime, Phaser.Easing.Sinusoidal.InOut, true);

			if(newCameraPosition) Game.adjustViewPosition(newCameraPosition.x, newCameraPosition.y, moveTime);

			WS.send({ command: 'player_move', position: newPosition, moveTime: moveTime, direction: direction, invertTexture: invertTexture, angle: Game.player.sprite.angle });

			if(direction === 'down'){
				var newDepth = newGridPos.y;

				if(Game.achievements['depth'+ newDepth]) Game.getAchievement('depth'+ newDepth);
			}
		}

		if(Game.player.hull.space < 1.5) Game.notify('Your Hull is\nalmost full');

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

			// if(Game.player.sprite.emitter){
			// 	Game.player.sprite.emitter.destroy();
			// 	Game.player.sprite.emitter = null;
			// }
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

		if(item === 'teleporter' || item === 'repair_nanites'){
			Game.applyEffects(Game.config.items[item] && Game.config.items[item].useEffects ? Game.config.items[item].useEffects : [Cjs.randFromArr(Object.keys(Game.effects))]);
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
			Game['itemSlot'+ slotNum].itemSprite.animations.play('use_detonator');

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

				Game.effects.teleport('spaceco');
			}

			else{
				Game.effects.teleport('responder');

				Game.player.responder.destroy();
				Game.player.responder = null;
			}
		}

		else{
			Log()(item, ' not yet implemented use func');
		}

		if(item !== 'detonator'){
			if(item === 'responder_teleporter' && Game.player.responder) return;

			Game.effects.loseInvItem(item);

			if(!Game.player.inventory[item] && !item.includes('remote')) Game.entities.itemSlot.setItem(slotNum, '');
		}
	};

	Game.player.openHUD = function(){
		if(Game.player.tradee === ':~:spaceco:~:') Game.spaceco.open();

		else if(Game.player.tradee) Game.hud.open('trade');

		else Game.hud.open('console');
	};

	Game.player.kill = function(by){
		Game.loseDepth = Game.toGridPos(Game.player.sprite.y);
		Game.loseReason = by;

		WS.send({ command: 'player_death', by: by, at: Game.loseDepth });

		Game.player.sprite.destroy();

		return Game.phaser.time.events.add(200, function(){ Game.phaser.state.start('end'); }, this);
	};

	Game.player.acceptOffer = function(){
		var itemNames = Object.keys(Game.player.tradeFor), x;

		for(x = 0; x < itemNames.length; ++x){
			Game.effects.getInvItem(itemNames[x], Game.player.tradeFor[itemNames[x]]);
		}

		itemNames = Object.keys(Game.player.offer);

		for(x = 0; x < itemNames.length; ++x){
			Game.effects.loseInvItem(itemNames[x], Game.player.offer[itemNames[x]]);
		}

		Game.player.tradee = null;

		Game.player.offer_accepted = Game.player.offer_sent_accept = 0;

		Game.player.offer = {};
		Game.player.tradeFor = {};

		Game.hud.close();
	};
};