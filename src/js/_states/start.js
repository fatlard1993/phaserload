/* global Phaser, Game, Socket, Log */

Game.states.start = function(game){};

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
		Game.players[playerNames[x]].sprite = Game.entities.player.create(Game.players[playerNames[x]], playerNames[x] === Game.player.name);
		if(playerNames[x] === Game.player.name) Game.player.sprite = Game.players[playerNames[x]].sprite;
	}

	Game.hud = Game.entities.hud.create(0, 0);

	Game.itemSlot1 = Game.entities.itemSlot.create(Game.viewWidth - 32, 32);
	Game.itemSlot2 = Game.entities.itemSlot.create(Game.viewWidth - 32, 106);

	Game.entities.hud.open('briefing');

	Game.drawView(0, 0, Game.config.width, Game.config.depth / 2);

	if(Game.purchasedTransport){
		Game.purchasedTransport = false;
	}
	else{
		Game.entities.spaceco.resourceBay = {};

		Game.player.inventory = {
			teleporter: 1
		};

		Game.entities.itemSlot.setItem(1, 'teleporter');

		Game.player.hull = {
			space: 10,
			items: []
		};

		Game.player.upgrade = 0;
		Game.player.health = 100;
		Game.player.credits = 0;
		Game.player.fuel = 5;
	}
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

		if(Game.hud.isOpen) Game.entities.hud.close();
		else{
			if(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) < Game.blockPx + 10) Game.entities.spaceco.open();
			else Game.entities.hud.open('hud');
			return;
		}
	}

	Game.lava.forEachAlive(function(lava){
		if(!Game.player.sprite.animations.getAnimation('teleporting').isPlaying && Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, lava.x, lava.y) < Game.blockPx/2){
			Game.entities.player.hurt(12 + Game.randFloat(1, 6), 'lava');
		}

		if(Game.phaser.math.distance(Game.spaceco.sprite.x, Game.spaceco.sprite.y, lava.x, lava.y) < Game.blockPx){
			Game.entities.spaceco.hurt(1, 'lava');
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
			Game.entities.player.hurt(10 + Game.randFloat(1, 5), 'gas');
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
			Game.entities.player.hurt(5 + Game.randFloat(1, 5), 'monster');
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

			Game.entities.spaceco.hurt(1, 'falling');
		}
	}

	if(this.input.activePointer.isDown){
		if(Game.hud.isOpen && !Game.hud.justUsedItemSlot && !Game.phaser.tweens.isTweening(Game.hud.scale)){
			if(this.input.activePointer.x > 575 || this.input.activePointer.y > 460) Game.entities.hud.close();

			else if(Game.hud.isOpen === 'trade') Game.entities.player.handlePointer(this.input.activePointer);

			else if(Game.entities[Game.hud.isOpen] && Game.entities[Game.hud.isOpen].handlePointer) Game.entities[Game.hud.isOpen].handlePointer(this.input.activePointer);

			else Game.entities.hud.close();

			return;
		}

		else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 32) < 32){
			if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;
			Game.hud.justUsedItemSlot = true;
			Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

			if(!Game.itemSlot1.item) Game.entities.hud.open('hud');
			else Game.entities.player.useItem(1, Game.itemSlot1.item);

			return;
		}

		else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, Game.viewWidth - 32, 106) < 32){
			if(Game.hud.justUsedItemSlot || Game.hud.isOpen) return;
			Game.hud.justUsedItemSlot = true;
			Game.hud.justUsedItemSlot_TO = setTimeout(function(){ Game.hud.justUsedItemSlot = false; }, 500);

			if(!Game.itemSlot2.item) Game.entities.hud.open('hud');
			else Game.entities.player.useItem(2, Game.itemSlot2.item);

			return;
		}

		else if(Game.phaser.math.distance(this.input.activePointer.x, this.input.activePointer.y, 70, 50) < 128){
			if(Game.phaser.math.distance(Game.player.sprite.x, Game.player.sprite.y, Game.spaceco.sprite.x, Game.spaceco.sprite.y) < Game.blockPx + 10) Game.entities.spaceco.open();
			else{
				var tradePlayer, playerNames = Object.keys(Game.players);

				for(var x = 0; x < playerNames.length; x++){
					if(playerNames[x] === Game.player.name) continue;

					var player_x = Game.players[playerNames[x]];
					if(Game.player.sprite.x === player_x.x && Game.player.sprite.y === player_x.y) tradePlayer = playerNames[x];
				}

				if(!tradePlayer) return Game.entities.hud.open('hud');

				Game.entities.player.openTrade(tradePlayer);
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
			if(Game.hud.view === 'shop') Game.entities.spaceco.setView('shop_p2');
			else selectedMenu = 'shop';
		}

		else if(this.input.keyboard.isDown(Phaser.Keyboard.ONE)){
			if(Game.hud.isOpen === 'hud'){
				if(Game.hud.view === 'inventory'){
					selectedItem = Game.entities.hud.inventoryItemNames[0];
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
					selectedItem = Game.entities.hud.inventoryItemNames[1];
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
					selectedItem = Game.entities.hud.inventoryItemNames[2];
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
					selectedItem = Game.entities.hud.inventoryItemNames[3];
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
					selectedItem = Game.entities.hud.inventoryItemNames[4];
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
					selectedItem = Game.entities.hud.inventoryItemNames[5];
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
		var surrounds = Game.entities.player.getSurrounds(Game.player.name);

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
			Game.entities.player.useItem(1, Game.itemSlot1.item);
		}
		else if(this.input.keyboard.isDown(Phaser.Keyboard.TWO)){
			Game.entities.player.useItem(2, Game.itemSlot2.item);
		}

		if(moving){
			Game.entities.player.move(moving);
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

					if(Game.player.lastMove === 'down') Game.entities.player.hurt(Game.randFloat(1, 3), 'falling');

					Log()('falling');
				}

				Game.entities.player.move(direction);
			}
		}
	}
};