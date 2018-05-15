/* global Phaser, Game, Log, Cjs, WS */

var HUDLayout = { // todo make this a player setting
	position: 'GPS',
	credits: '$',
	health: 'Health',
	fuel: 'Fuel',
	hull: 'Hull'
};

Game.entities.hud = function(){
	Phaser.Image.call(this, Game.phaser, 0, 0, 'map', 'hud');

	this.scale.setTo(0.4, 0.4);

	this.fixedToCamera = true;
};

Game.entities.hud.prototype = Object.create(Phaser.Image.prototype);
Game.entities.hud.prototype.constructor = Game.entities.hud;

Game.entities.hud.create = function(){
	var hud = Game.foreground.add(new Game.entities.hud());

	hud.isOpen = false;

	hud.statusText = Game.phaser.add.text(20, 15, '', { font: '26px '+ Game.config.font, fill: Game.config.hudTextColor });
	hud.statusText.lineSpacing = -8;
	hud.addChild(hud.statusText);

	hud.interfaceText = Game.phaser.add.text(20, 20, '', { font: '13px '+ Game.config.font, fill: '#fff', fontWeight: 'bold' });
	hud.addChild(hud.interfaceText);

	hud.bottomLine = Game.phaser.add.text(20, 211, '', { font: '11px '+ Game.config.font, fill: Game.config.hudTextColor });
	hud.addChild(hud.bottomLine);

	return hud;
};

Game.entities.hud.init = function(){
	Game.hud = Game.entities.hud.create(0, 0);

	Game.hud.update = function(){
		if(Game.hud.isOpen || Game.notify_TO) return;

		Game.hud.interfaceText.setText('');
		Game.hud.bottomLine.setText('');

		var hudItemNames = Object.keys(HUDLayout), hudItemCount = hudItemNames.length;
		var statusText;
		var shortestLength = 1;
		var longestLength = 6;

		for(var x = 0; x < hudItemCount; x++){
			var item = hudItemNames[x];
			var value = HUDLayout[hudItemNames[x]].split(':~:');
			var spacer = (' '.repeat(value[0].length > shortestLength ? longestLength - (value[0].length - shortestLength) : longestLength));
			if(statusText) statusText += '\n'+ value[0] + spacer;
			else statusText = value[0] + spacer;

			if(item === 'position') statusText += 'x'+ Game.toGridPos(Game.player.sprite.x) +' y'+ Game.toGridPos(Game.player.sprite.y);
			else if(item === 'health') statusText += Cjs.toFixed(Game.player.health, 2) +'/'+ Game.player.max_health;
			else if(item === 'fuel') statusText += Cjs.toFixed(Game.player.fuel, 2) +'/'+ Game.player.max_fuel;
			else if(item === 'credits') statusText += Cjs.toFixed(Game.player.credits, 2);
			else if(item === 'hull') statusText += Cjs.toFixed(Game.player.hull.space, 2) +'/'+ Game.player.max_hullSpace;
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
		if(!Game.hud.isOpen) return;

		if(pointer.x >= 450 && pointer.x <= 550 && pointer.y >= 25 && pointer.y <= 70){// exit
			Game.hud.close();
		}

		else if(pointer.y > 70 && pointer.y < 105){// menu
			if(pointer.x > 30 && pointer.x < 160){
				Game.hud.useMenu(0);
			}

			else if(pointer.x > 160 && pointer.x < 290){
				Game.hud.useMenu(1);
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

		var mineralNames = {
			white: 'tritanium',
			orange: 'duranium',
			yellow: 'pentrilium',
			green: 'byzanium',
			teal: 'etherium',
			blue: 'mithril',
			purple: 'octanium',
			pink: 'saronite',
			red: 'adamantite',
			black: 'quadium'
		};

		if(Game.hud.isOpen.name === 'briefing'){
			Game.hud.isOpen.menuItems = ['Briefing', 'Help'];

			if(selection === 0){
				var briefingLines = Game.config.world.name, briefingLineCount = briefingLines.length;

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
					inventoryItems[x] = Cjs.capitalize(Cjs.capitalize(inventoryItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.inventory[inventoryItems[x]];

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
					if(hullItems[x] === 'space') hullItems[x] = 'Space:~:'+ Cjs.toFixed(Game.player.hull[hullItems[x]], 2);
					else hullItems[x] = (hullItems[x].startsWith('ground') ? 'Trace ' : 'Concentrated ') + Cjs.capitalize(mineralNames[hullItems[x].replace('ground_', '').replace('mineral_', '')]) +':~:'+ Cjs.toFixed(Game.player.hull[hullItems[x]], 2);
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
					configurationParts[x] = Cjs.capitalize(configurationParts[x], 1, '_') +':~:'+ Cjs.capitalize(Game.player.configuration[configurationParts[x]], 1, ':~:');
				}

				Game.hud.isOpen.view = 'config';
				Game.hud.isOpen.menuItems[2] = '[ Conf ]';
				Game.hud.isOpen.pageItems = configurationParts;
			}
		}

		else if(Game.hud.isOpen.name === 'spaceco'){
			Game.hud.isOpen.menuItems = ['Rates', 'Fuel', 'Parts', 'Shop'];

			if(selection === 0){
				var materialNames = ['tritanium', 'duranium', 'pentrilium', 'byzanium', 'etherium', 'mithril', 'octanium', 'saronite', 'adamantite', 'quadium'];
				var rawMaterials = ['ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black', 'mineral_white', 'mineral_orange', 'mineral_yellow', 'mineral_green', 'mineral_teal', 'mineral_blue', 'mineral_purple', 'mineral_pink', 'mineral_red', 'mineral_black'];
				var rawMaterialCount = rawMaterials.length;

				for(x = 0; x < rawMaterialCount; ++x){
					rawMaterials[x] = (rawMaterials[x].startsWith('ground') ? 'Trace ' : 'Concentrated ') + Cjs.capitalize(materialNames[x % 8]) +':~:$'+ Game.spaceco.getValue(rawMaterials[x]).toFixed(2);
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
					fuels[x] = Cjs.capitalize(fuels[x], 1, '_') +':~:$'+ Game.spaceco.getValue(fuels[x]);
				}

				Game.hud.isOpen.view = 'fuel';
				Game.hud.isOpen.menuItems[1] = '[ Fuel ]';
				Game.hud.isOpen.pageItems = fuels;
			}

			else if(selection === 2){
				var parts = Object.keys(Game.spaceco.parts);
				var partCount = parts.length;

				for(x = 0; x < partCount; ++x){
					parts[x] = Cjs.capitalize(parts[x], 1, ':~:') +':~:$'+ Game.spaceco.getValue(parts[x]);
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
					shopItems[x] = Cjs.capitalize(shopItems[x], 1, '_') +':~:$'+ Game.spaceco.getValue(shopItems[x]);
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
					tradeInventoryItems[x] = Cjs.capitalize(Cjs.capitalize(tradeInventoryItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.inventory[tradeInventoryItems[x]];
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
					tradeOfferItems[x] = Cjs.capitalize(Cjs.capitalize(tradeOfferItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.offer[tradeOfferItems[x]];
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
					tradeForItems[x] = Cjs.capitalize(Cjs.capitalize(tradeForItems[x], 1, ':~:'), 1, '_') +':~:'+ Game.player.tradeFor[tradeForItems[x]];
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
					bottomLineText = 'Equipping '+ Cjs.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

					var itemBreakdown = item.split(':~:');

					if(itemBreakdown[2] && { tracks: 1, hull: 1, drill: 1, fuel_tank: 1 }[itemBreakdown[2]]){
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

		else if(Game.hud.isOpen.name === 'spaceco' && !Game.hud.isOpen.view.includes('rates')){
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

					else if((item === 'fuel' && !{ standard: 1, large: 1, oversized: 1, pressurized: 1 }[fuelTankType]) || (item === 'energy' && fuelTankType !== 'battery') || (item === 'super_oxygen_liquid_nitrogen' && fuelTankType !== 'condenser')){
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
						Game.effects.refuel(1.5, 0.4);
					}

					else if(item === 'energy'){
						Game.effects.refuel(3.2, 0.3);
					}

					else if(item === 'super_oxygen_liquid_nitrogen'){
						Game.effects.refuel(6.9, 0.2);
					}

					else if(item === 'repair'){
						Game.effects.repair(100);
					}

					else if(item === 'repair_spaceco'){
						Game.spaceco.hurt(-Game.spaceco.damage, 'repair');
					}

					else if(item === 'transport'){
						WS.send({ command: 'purchase_transport' });
					}

					else if(Game.hud.isOpen.view.includes('shop')){
						Game.effects.getInvItem(item);
					}

					else if(Game.hud.isOpen.view.includes('parts')){
						Game.effects.getInvItem(item);

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
					bottomLineText = 'Offering '+ Cjs.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

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
					bottomLineText = 'Revoking '+ Cjs.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

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
};