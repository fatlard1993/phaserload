/* global Game, Log, Cjs, WS, Phaser */

var BaseGroundValue = 0.5;	// todo make these a mode setting
var BaseMineralValue = 2.5;

Game.entities.spaceco = function(x, y){
	Phaser.Image.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'spaceco');

	this.anchor.setTo(0.5, 0.65);

	this.scale.setTo(0.25, 0.25);
};

Game.entities.spaceco.prototype = Object.create(Phaser.Image.prototype);
Game.entities.spaceco.prototype.constructor = Game.entities.spaceco;

Game.entities.spaceco.create = function(settings){
	var spaceco = Game.buildings.add(new Game.entities.spaceco(settings.position.x, settings.position.y || 1));

	spaceco.frame = spaceco.damage = spaceco.damage || 0;

	return spaceco;
};

Game.entities.spaceco.prototype.update = function(){
	if(!Game.initialized) return;

	if(Game.spaceco.damage <= 10 && !Game.phaser.tweens.isTweening(Game.spaceco.sprite)){
		var gridPos = Game.toGridPos(Game.spaceco.sprite);

		var spacecoCollision = Game.mapPos(gridPos).ground.name;

		if(spacecoCollision){
			Log()('spacecoCollision', spacecoCollision);

			if(spacecoCollision === 'lava') Game.spaceco.hurt(1, 'lava');
			else if(spacecoCollision === 'poisonous_gas') Game.spaceco.hurt(1, 'poisonous_gas');
			else if(spacecoCollision === 'red_monster') Game.spaceco.hurt(1, 'monster');
			else if(spacecoCollision === 'purple_monster') Game.spaceco.hurt(1, 'monster');
		}

		var spacecoGroundBase = Game.getSurrounds(gridPos, { bottomRight: 1, bottom: 1, bottomLeft: 1 }, 'ground');

		if(!spacecoGroundBase.bottomRight && !spacecoGroundBase.bottom && !spacecoGroundBase.bottomLeft){
			Game.phaser.add.tween(Game.spaceco.sprite).to({ y: Game.toPx(gridPos.y + 1) }, 300, Phaser.Easing.Sinusoidal.InOut, true);

			Game.spaceco.hurt(1, 'falling');
		}
	}
};

Game.entities.spaceco.init = function(){
	Game.spaceco.sprite = Game.entities.spaceco.create(Game.spaceco);

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

			WS.send({ command: 'player_sell_minerals', resourceBay: Game.spaceco.resourceBay });

			output.pageItems.push('Sold:');

			var soldItemNames = Object.keys(soldItems);

			for(x = 0; x < soldItemNames.length; ++x){
				output.pageItems.push(' '+ soldItems[soldItemNames[x]] +' x '+ soldItemNames[x] +'s');
			}

			output.pageItems.push('For '+ Cjs.toFixed(Game.player.credits - statingCredits, 2) +' credits');

			Game.player.hull = {
				space: Game.player.max_hullSpace
			};

			if(Game.player.credits - 0.1 < 0){
				Game.spaceco.getOut_TO = setTimeout(Game.spaceco.boot, 30 * 1000);
			}

			Game.hud.open(output);
		}, 1500);
	};

	Game.spaceco.updateBottomLine = function(){
		if(Game.hud.isOpen.name !== 'spaceco') return;

		var credits = String(parseInt(Game.player.credits));
		var fuel = Cjs.toFixed(Game.player.fuel, 2);
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
				Game.spaceco.sprite.destroy();

				Game.notify('Spaceco was killed\nby '+ by);
			}, 400);
		}

		else Game.spaceco.sprite.frame = Game.spaceco.damage;
	};

	Game.spaceco.getValue = function(name){
		var value;

		if(name.startsWith('ground')){
			value = BaseGroundValue + (((Game.config.densities[name.replace('ground_', '')] * 0.7) - ((Game.spaceco.resourceBay[name] || 0) / 2)) / 500);
		}

		else if(name.startsWith('mineral')){
			value = BaseMineralValue + (((Game.config.densities[name.replace('mineral_', '')] * 0.7) - ((Game.spaceco.resourceBay[name] || 0) / 2)) / 100);
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
};