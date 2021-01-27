import phaserload from '../../phaserload';

import util from 'js-util';
import socketClient from 'socket-client';
import Phaser from './node_modules/phaser/dist/phaser.min.js';

var HUDLayout = { // todo make this a player setting
	position: 'GPS',
	credits: '$',
	health: 'Health',
	fuel: 'Fuel',
	hull: 'Hull'
};

phaserload.entities.hud = function(){
	Phaser.Image.call(this, phaserload.game, 0, 0, 'map', 'hud');

	this.scale.setTo(0.4, 0.4);

	this.fixedToCamera = true;
};

phaserload.entities.hud.prototype = Object.create(Phaser.Image.prototype);
phaserload.entities.hud.prototype.constructor = phaserload.entities.hud;

phaserload.entities.hud.create = function(){
	var hud = phaserload.foreground.add(new phaserload.entities.hud());

	hud.isOpen = false;

	hud.statusText = phaserload.game.add.text(20, 15, '', { font: '26px '+ phaserload.config.font, fill: phaserload.config.hudTextColor });
	hud.statusText.lineSpacing = -8;
	hud.addChild(hud.statusText);

	hud.interfaceText = phaserload.game.add.text(20, 20, '', { font: '13px '+ phaserload.config.font, fill: '#fff', fontWeight: 'bold' });
	hud.addChild(hud.interfaceText);

	hud.bottomLine = phaserload.game.add.text(20, 211, '', { font: '11px '+ phaserload.config.font, fill: phaserload.config.hudTextColor });
	hud.addChild(hud.bottomLine);

	return hud;
};

phaserload.entities.hud.init = function(){
	phaserload.hud = phaserload.entities.hud.create(0, 0);

	phaserload.hud.update = function(){
		if(phaserload.hud.isOpen || phaserload.notify_TO) return;

		phaserload.hud.interfaceText.setText('');
		phaserload.hud.bottomLine.setText('');

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

			if(item === 'position') statusText += 'x'+ phaserload.toGridPos(phaserload.player.sprite.x) +' y'+ phaserload.toGridPos(phaserload.player.sprite.y);
			else if(item === 'health') statusText += util.toFixed(phaserload.player.health, 2) +'/'+ phaserload.player.max_health;
			else if(item === 'fuel') statusText += util.toFixed(phaserload.player.fuel, 2) +'/'+ phaserload.player.max_fuel;
			else if(item === 'credits') statusText += util.toFixed(phaserload.player.credits, 2);
			else if(item === 'hull') statusText += util.toFixed(phaserload.player.hull.space, 2) +'/'+ phaserload.player.max_hullSpace;
			else{
				if(item.startsWith('mineral') && phaserload.player.hull[item]) statusText += phaserload.player.hull[item];
			}
		}

		phaserload.hud.statusText.setText(statusText);
	};

	phaserload.hud.open = function(opts){
		// Log()('open hud', opts, phaserload.hud.isOpen);

		phaserload.hud.clear();

		if(typeof opts === 'string'){
			if(opts === 'briefing'){
				phaserload.hud.isOpen = opts = {
					name: 'briefing',
					heading: 'WELCOME',
					menuItems: ['Briefing', 'Help'],
					pageItems: []
				};
			}

			else if(opts === 'console'){
				phaserload.hud.isOpen = opts = {
					name: 'console',
					heading: 'CONSOLE',
					menuItems: ['Inventory', 'Hull', 'Config'],
					pageItems: []
				};
			}

			else if(opts === 'trade'){
				phaserload.hud.isOpen = opts = {
					name: 'trade',
					heading: 'TRADE',
					menuItems: ['Inventory', 'Offer', 'For', 'Accept'],
					pageItems: []
				};

				phaserload.player.offer_accepted = phaserload.player.offer_sent_accept = 0;

				phaserload.player.offer = {};
				phaserload.player.tradeFor = {};
			}
		}

		else phaserload.hud.isOpen = opts = opts || phaserload.hud.isOpen;

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
			pageItem = util.capitalize(splitPageItem[0]);
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

		phaserload.hud.interfaceText.setText(text);

		if(opts.name === 'spaceco') phaserload.spaceco.updateBottomLine();

		var scale = { x: 1.79, y: 1.79 };

		phaserload.game.add.tween(phaserload.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
	};

	phaserload.hud.close = function(){
		phaserload.hud.isOpen = false;

		if(phaserload.hud.briefingOpen) phaserload.hud.briefingOpen = false;

		if(phaserload.hud.emitter){
			phaserload.hud.emitter.destroy();
			phaserload.hud.emitter = null;
		}

		phaserload.player.tradee = null;

		phaserload.hud.interfaceText.setText('');
		phaserload.hud.bottomLine.setText('');

		phaserload.game.add.tween(phaserload.hud.scale).to({ x: 0.5, y: 0.5 }, 600, Phaser.Easing.Circular.Out, true);

		phaserload.hud.update();
	};

	phaserload.hud.clear = function(){
		phaserload.hud.statusText.setText('');
		phaserload.hud.interfaceText.setText('');
		phaserload.hud.bottomLine.setText('');
	};

	phaserload.hud.handlePointer = function(pointer){
		if(!phaserload.hud.isOpen) return;

		if(pointer.x >= 450 && pointer.x <= 550 && pointer.y >= 25 && pointer.y <= 70){// exit
			phaserload.hud.close();
		}

		else if(pointer.y > 70 && pointer.y < 105){// menu
			if(pointer.x > 30 && pointer.x < 160){
				phaserload.hud.useMenu(0);
			}

			else if(pointer.x > 160 && pointer.x < 290){
				phaserload.hud.useMenu(1);
			}

			else if(pointer.x > 290 && pointer.x < 415){
				phaserload.hud.useMenu(2);
			}

			else if(pointer.x > 415 && pointer.x < 550){
				phaserload.hud.useMenu(3);
			}
		}

		else if(pointer.y > 105 && pointer.y < 380 && pointer.x > 30 && pointer.x < 550){// pageItems
			if(pointer.y > 105 && pointer.y < 140){
				phaserload.hud.selectItem(0);
			}

			else if(pointer.y > 140 && pointer.y < 185){
				phaserload.hud.selectItem(1);
			}

			else if(pointer.y > 185 && pointer.y < 225){
				phaserload.hud.selectItem(2);
			}

			else if(pointer.y > 225 && pointer.y < 265){
				phaserload.hud.selectItem(3);
			}

			else if(pointer.y > 265 && pointer.y < 305){
				phaserload.hud.selectItem(4);
			}

			else if(pointer.y > 305 && pointer.y < 345){
				phaserload.hud.selectItem(5);
			}

			else if(pointer.y > 345 && pointer.y < 385){
				phaserload.hud.selectItem(6);
			}
		}

		else{// outside / dead space
			// phaserload.hud.close();
		}
	};

	phaserload.hud.useMenu = function(selection){
		// Log()('useMenu', selection);

		if(!phaserload.hud.isOpen) return;

		var x;

		if(phaserload.hud.isOpen.name === 'briefing'){
			phaserload.hud.isOpen.menuItems = ['Briefing', 'Help'];

			if(selection === 0){
				var briefingLines = phaserload.state.world.name, briefingLineCount = briefingLines.length;

				if(phaserload.hud.isOpen.view === 'briefing' && briefingLineCount > 7){
					phaserload.hud.isOpen.view = 'briefing_pg2';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = briefingLines.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'briefing_pg2' && briefingLineCount > 14){
					phaserload.hud.isOpen.view = 'briefing_pg3';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = briefingLines.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'briefing';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = briefingLines.slice(0, 7);
				}
			}

			else if(selection === 1){
				var helpLines = phaserload.helpText, helpLineCount = helpLines.length;

				if(phaserload.hud.isOpen.view === 'help' && helpLineCount > 7){
					phaserload.hud.isOpen.view = 'help_pg2';
					phaserload.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = helpLines.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'help_pg2' && helpLineCount > 14){
					phaserload.hud.isOpen.view = 'help_pg3';
					phaserload.hud.isOpen.menuItems[1] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = helpLines.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'help';
					phaserload.hud.isOpen.menuItems[1] = '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = helpLines.slice(0, 7);
				}
			}
		}

		else if(phaserload.hud.isOpen.name === 'console'){
			phaserload.hud.isOpen.menuItems = ['Inventory', 'Hull', 'Config'];

			if(selection === 0){
				var inventoryItems = Object.keys(phaserload.player.inventory), inventoryItemCount = inventoryItems.length;

				for(x = 0; x < inventoryItemCount; ++x){
					inventoryItems[x] = util.capitalize(util.capitalize(inventoryItems[x], 1, ':~:'), 1, '_') +':~:'+ phaserload.player.inventory[inventoryItems[x]];

					if(phaserload.itemSlot1.item === inventoryItems[x]) inventoryItems[x] = '[ 1 ] '+ inventoryItems[x];
					else if(phaserload.itemSlot2.item === inventoryItems[x]) inventoryItems[x] = '[ 2 ] '+ inventoryItems[x];
				}

				if(phaserload.hud.isOpen.view === 'inventory' && inventoryItemCount > 7){
					phaserload.hud.isOpen.view = 'inventory_pg2';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = inventoryItems.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'inventory_pg2' && inventoryItemCount > 14){
					phaserload.hud.isOpen.view = 'inventory_pg3';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = inventoryItems.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'inventory';
					phaserload.hud.isOpen.menuItems[0] = inventoryItemCount <= 7 ? '[ Inv ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = inventoryItems.slice(0, 7);
				}
			}

			else if(selection === 1){
				var hullItems = Object.keys(phaserload.player.hull), hullItemCount = hullItems.length;

				for(x = 0; x < hullItemCount; ++x){
					if(hullItems[x] === 'space') hullItems[x] = 'Space:~:'+ util.toFixed(phaserload.player.hull[hullItems[x]], 2);
					else hullItems[x] = (hullItems[x].startsWith('ground') ? 'Trace ' : 'Concentrated ') + util.capitalize(phaserload.options.mineralNames[hullItems[x].replace('ground_', '').replace('mineral_', '')]) +':~:'+ util.toFixed(phaserload.player.hull[hullItems[x]], 2);
				}

				if(phaserload.hud.view === 'hull' && hullItemCount > 7){
					phaserload.hud.isOpen.view = 'hull_pg2';
					phaserload.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = hullItems.slice(7, 14);
				}
				else if(phaserload.hud.view === 'hull_pg2' && hullItemCount > 14){
					phaserload.hud.isOpen.view = 'hull_pg3';
					phaserload.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = hullItems.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'hull';
					phaserload.hud.isOpen.menuItems[1] = hullItemCount <= 7 ? '[ Hull ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = hullItems.slice(0, 7);
				}
			}

			else if(selection === 2){
				var configurationParts = Object.keys(phaserload.player.configuration), drillItemCount = configurationParts.length;

				for(x = 0; x < drillItemCount; ++x){
					configurationParts[x] = util.capitalize(configurationParts[x], 1, '_') +':~:'+ util.capitalize(phaserload.player.configuration[configurationParts[x]], 1, ':~:');
				}

				phaserload.hud.isOpen.view = 'config';
				phaserload.hud.isOpen.menuItems[2] = '[ Conf ]';
				phaserload.hud.isOpen.pageItems = configurationParts;
			}
		}

		else if(phaserload.hud.isOpen.name === 'spaceco'){
			phaserload.hud.isOpen.menuItems = ['Rates', 'Fuel', 'Parts', 'Shop'];

			if(selection === 0){
				var materialNames = ['tritanium', 'duranium', 'pentrilium', 'byzanium', 'etherium', 'mithril', 'octanium', 'saronite', 'adamantite', 'quadium'];
				var rawMaterials = ['ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black', 'mineral_white', 'mineral_orange', 'mineral_yellow', 'mineral_green', 'mineral_teal', 'mineral_blue', 'mineral_purple', 'mineral_pink', 'mineral_red', 'mineral_black'];
				var rawMaterialCount = rawMaterials.length;

				for(x = 0; x < rawMaterialCount; ++x){
					rawMaterials[x] = (rawMaterials[x].startsWith('ground') ? 'Trace ' : 'Concentrated ') + util.capitalize(materialNames[x % 8]) +':~:$'+ phaserload.spaceco.getValue(rawMaterials[x]).toFixed(2);
				}

				if(phaserload.hud.isOpen.view === 'rates' && rawMaterialCount > 7){
					phaserload.hud.isOpen.view = 'rates_pg2';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = rawMaterials.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'rates_pg2' && rawMaterialCount > 14){
					phaserload.hud.isOpen.view = 'rates_pg3';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = rawMaterials.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'rates';
					phaserload.hud.isOpen.menuItems[0] = rawMaterialCount <= 7 ? '[ Rates ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = rawMaterials.slice(0, 7);
				}
			}

			else if(selection === 1){
				var fuels = Object.keys(phaserload.state.world.spaceco.fuel);
				var fuelCount = fuels.length;

				for(x = 0; x < fuelCount; ++x){
					fuels[x] = util.capitalize(fuels[x], 1, '_') +':~:$'+ phaserload.spaceco.getValue(fuels[x]);
				}

				phaserload.hud.isOpen.view = 'fuel';
				phaserload.hud.isOpen.menuItems[1] = '[ Fuel ]';
				phaserload.hud.isOpen.pageItems = fuels;
			}

			else if(selection === 2){
				var parts = Object.keys(phaserload.spaceco.parts);
				var partCount = parts.length;

				for(x = 0; x < partCount; ++x){
					parts[x] = util.capitalize(parts[x], 1, ':~:') +':~:$'+ phaserload.spaceco.getValue(parts[x]);
				}

				if(phaserload.hud.isOpen.view === 'parts' && partCount > 7){
					phaserload.hud.isOpen.view = 'parts_pg2';
					phaserload.hud.isOpen.menuItems[2] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = parts.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'parts_pg2' && partCount > 14){
					phaserload.hud.isOpen.view = 'parts_pg3';
					phaserload.hud.isOpen.menuItems[2] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = parts.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'parts';
					phaserload.hud.isOpen.menuItems[2] = partCount <= 7 ? '[ Parts ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = parts.slice(0, 7);
				}
			}

			else if(selection === 3){
				var shopItems = Object.keys(phaserload.state.world.spaceco.shop);
				var shopCount = shopItems.length;

				for(x = 0; x < shopCount; ++x){
					shopItems[x] = util.capitalize(shopItems[x], 1, '_') +':~:$'+ phaserload.spaceco.getValue(shopItems[x]);
				}

				if(phaserload.hud.isOpen.view === 'shop' && shopCount > 7){
					phaserload.hud.isOpen.view = 'shop_pg2';
					phaserload.hud.isOpen.menuItems[3] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = shopItems.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'shop_pg2' && shopCount > 14){
					phaserload.hud.isOpen.view = 'shop_pg3';
					phaserload.hud.isOpen.menuItems[3] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = shopItems.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'shop';
					phaserload.hud.isOpen.menuItems[3] = shopCount <= 7 ? '[ Shop ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = shopItems.slice(0, 7);
				}
			}
		}

		else if(phaserload.hud.isOpen.name === 'trade'){
			phaserload.hud.isOpen.menuItems = ['Inventory', 'Offer', 'For', 'Accept'];

			if(selection === 0){
				var tradeInventoryItems = Object.keys(phaserload.player.inventory), tradeInventoryItemCount = tradeInventoryItems.length;

				for(x = 0; x < tradeInventoryItemCount; ++x){
					tradeInventoryItems[x] = util.capitalize(util.capitalize(tradeInventoryItems[x], 1, ':~:'), 1, '_') +':~:'+ phaserload.player.inventory[tradeInventoryItems[x]];
				}

				if(phaserload.hud.isOpen.view === 'tradeInventory' && tradeInventoryItemCount > 7){
					phaserload.hud.isOpen.view = 'tradeInventory_pg2';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = tradeInventoryItems.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'tradeInventory_pg2' && tradeInventoryItemCount > 14){
					phaserload.hud.isOpen.view = 'tradeInventory_pg3';
					phaserload.hud.isOpen.menuItems[0] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = tradeInventoryItems.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'tradeInventory';
					phaserload.hud.isOpen.menuItems[0] = tradeInventoryItemCount <= 7 ? '[ Inv ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = tradeInventoryItems.slice(0, 7);
				}
			}

			else if(selection === 1){
				var tradeOfferItems = Object.keys(phaserload.player.offer), tradeOfferItemCount = tradeOfferItems.length;

				for(x = 0; x < tradeOfferItemCount; ++x){
					tradeOfferItems[x] = util.capitalize(util.capitalize(tradeOfferItems[x], 1, ':~:'), 1, '_') +':~:'+ phaserload.player.offer[tradeOfferItems[x]];
				}

				if(phaserload.hud.isOpen.view === 'tradeOffer' && tradeOfferItemCount > 7){
					phaserload.hud.isOpen.view = 'tradeOffer_pg2';
					phaserload.hud.isOpen.menuItems[1] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = tradeOfferItems.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'tradeOffer_pg2' && tradeOfferItemCount > 14){
					phaserload.hud.isOpen.view = 'tradeOffer_pg3';
					phaserload.hud.isOpen.menuItems[1] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = tradeOfferItems.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'tradeOffer';
					phaserload.hud.isOpen.menuItems[1] = tradeOfferItemCount <= 7 ? '[ Offer ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = tradeOfferItems.slice(0, 7);
				}
			}

			else if(selection === 2){
				var tradeForItems = Object.keys(phaserload.player.tradeFor), tradeForItemCount = tradeForItems.length;

				for(x = 0; x < tradeForItemCount; ++x){
					tradeForItems[x] = util.capitalize(util.capitalize(tradeForItems[x], 1, ':~:'), 1, '_') +':~:'+ phaserload.player.tradeFor[tradeForItems[x]];
				}

				if(phaserload.hud.isOpen.view === 'tradeFor' && tradeForItemCount > 7){
					phaserload.hud.isOpen.view = 'tradeFor_pg2';
					phaserload.hud.isOpen.menuItems[2] = '[ pg 2 ]';
					phaserload.hud.isOpen.pageItems = tradeForItems.slice(7, 14);
				}
				else if(phaserload.hud.isOpen.view === 'tradeFor_pg2' && tradeForItemCount > 14){
					phaserload.hud.isOpen.view = 'tradeFor_pg3';
					phaserload.hud.isOpen.menuItems[2] = '[ pg 3 ]';
					phaserload.hud.isOpen.pageItems = tradeForItems.slice(14, 21);
				}
				else{
					phaserload.hud.isOpen.view = 'tradeFor';
					phaserload.hud.isOpen.menuItems[2] = tradeForItemCount <= 7 ? '[ For ]' : '[ pg 1 ]';
					phaserload.hud.isOpen.pageItems = tradeForItems.slice(0, 7);
				}
			}

			else if(selection === 3){
				phaserload.player.offer_sent_accept = 1;

				phaserload.hud.isOpen.view = 'accept';
				phaserload.hud.isOpen.menuItems[3] = 'ACCEPTED';

				socketClient.reply('player_accept_offer', { to: phaserload.player.tradee });

				if(phaserload.player.offer_accepted) phaserload.player.acceptOffer();

				else phaserload.hud.bottomLine.setText('offer accepted');
			}
		}

		else return;

		phaserload.hud.open();
	};

	phaserload.hud.selectItem = function(selection){
		// Log()('selectItem', selection);
		if(!phaserload.hud.isOpen) return;

		if(phaserload.hud.justSelectedItem) return;
		phaserload.hud.justSelectedItem = true;

		var timeout = 700, item, bottomLineText;

		if(phaserload.hud.isOpen.name === 'console'){
			if(phaserload.hud.isOpen.view.includes('inventory')){
				item = Object.keys(phaserload.player.inventory)[selection + (phaserload.hud.isOpen.view.includes('pg') ? (parseInt(phaserload.hud.isOpen.view.slice(-1)) - 1) * 7 : 0)];

				if(item){
					bottomLineText = 'Equipping '+ util.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

					var itemBreakdown = item.split(':~:');

					if(itemBreakdown[2] && { tracks: 1, hull: 1, drill: 1, fuel_tank: 1 }[itemBreakdown[2]]){
						delete phaserload.player.inventory[item];

						phaserload.player.inventory[phaserload.player.configuration[itemBreakdown[2]] +':~:'+ itemBreakdown[2]] = 1;

						phaserload.player.configuration[itemBreakdown[2]] = itemBreakdown[0] +':~:'+ itemBreakdown[1];

						phaserload.updateMaxHealth();
						phaserload.updateMaxFuel();
						phaserload.updateBaseMoveTime();
						phaserload.updateMaxHullSpace();
						phaserload.updateDrillSpeedMod();

						redraw = 2;
					}

					else{
						var slot = 1;

						if(phaserload.itemSlot1.item === item){
							phaserload.entities.itemSlot.setItem(1, '');
							slot = 2;
						}

						else if(phaserload.itemSlot2.item === item){
							phaserload.entities.itemSlot.setItem(2, '');
							slot = -1;
						}

						if(slot > 0){
							if(phaserload['itemSlot'+ slot].item && !phaserload['itemSlot'+ (slot === 1 ? 2 : 1)].item) slot = slot === 1 ? 2 : 1;
							else if(phaserload['itemSlot'+ slot].item) phaserload.entities.itemSlot.setItem(slot, '');

							phaserload.entities.itemSlot.setItem(slot, item);
						}

						phaserload.hud.isOpen.pageItems[selection] = (slot > 0 ? '[ '+ slot +' ] ' : '') + phaserload.hud.isOpen.pageItems[selection].replace(/\[\s\d\s\]\s/, '');

						redraw = 0;
					}

					phaserload.hud.open();
				}
			}
		}

		else if(phaserload.hud.isOpen.name === 'spaceco' && !phaserload.hud.isOpen.view.includes('rates')){
			item = phaserload.hud.isOpen.pageItems[selection];

			if(item){
				var canUse = true, redraw = false, price;

				item = item.toLowerCase().replace(/:~:.*/, '');

				if(phaserload.hud.isOpen.view.includes('parts')) item = item.replace(/\s/g, ':~:');

				else item = item.replace(/\s/g, '_');

				if(phaserload.hud.isOpen.view.includes('fuel')){
					timeout = 400;

					var fuelTankType = phaserload.player.configuration.fuel_tank.split(':~:')[0];

					if(phaserload.player.fuel >= phaserload.player.max_fuel){
						canUse = false;
						bottomLineText = 'Full!';
					}

					else if((item === 'fuel' && !{ standard: 1, large: 1, oversized: 1, pressurized: 1 }[fuelTankType]) || (item === 'energy' && fuelTankType !== 'battery') || (item === 'super_oxygen_liquid_nitrogen' && fuelTankType !== 'condenser')){
						canUse = false;
						bottomLineText = 'Cant use this fuel type!';
					}
				}

				else if(phaserload.hud.isOpen.view.includes('parts')){
					// todo?
				}

				else if(phaserload.hud.isOpen.view.includes('shop')){
					price = phaserload.spaceco.getValue(item);

					if(item === 'repair' && phaserload.player.health >= phaserload.player.max_health){
						canUse = false;
						bottomLineText = 'Fully repaired!';
					}
				}

				price = phaserload.spaceco.getValue(item);

				if(phaserload.player.credits < price){
					canUse = false;
					bottomLineText = 'Not enough credits!';
				}

				if(canUse){
					phaserload.player.credits -= price;

					bottomLineText = phaserload.hud.isOpen.pageItems[selection].replace(':~:' ,' : ');

					if(item === 'gas'){
						phaserload.effects.refuel(1.5, 0.4);
					}

					else if(item === 'energy'){
						phaserload.effects.refuel(3.2, 0.3);
					}

					else if(item === 'super_oxygen_liquid_nitrogen'){
						phaserload.effects.refuel(6.9, 0.2);
					}

					else if(item === 'repair'){
						phaserload.effects.repair(100);
					}

					else if(item === 'repair_spaceco'){
						phaserload.spaceco.hurt(-phaserload.spaceco.damage, 'repair');
					}

					else if(item === 'transport'){
						socketClient.reply('purchase_transport', true);
					}

					else if(phaserload.hud.isOpen.view.includes('shop')){
						phaserload.effects.getInvItem(item);
					}

					else if(phaserload.hud.isOpen.view.includes('parts')){
						phaserload.effects.getInvItem(item);

						delete phaserload.spaceco.parts[item];

						socketClient.reply('player_purchase_part', { partName: item });

						redraw = 2;

						log()(price, item);
					}
				}
			}
		}

		else if(phaserload.hud.isOpen.name === 'trade'){
			if(phaserload.hud.isOpen.view.includes('Inventory')){
				item = Object.keys(phaserload.player.inventory)[selection + (phaserload.hud.isOpen.view.includes('pg') ? (parseInt(phaserload.hud.isOpen.view.slice(-1)) - 1) * 7 : 0)];

				if(item){
					bottomLineText = 'Offering '+ util.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

					phaserload.player.offer[item] = phaserload.player.offer[item] || 0;

					phaserload.player.offer[item] = Math.min(phaserload.player.offer[item] + 1, phaserload.player.inventory[item]);

					socketClient.reply('player_update_offer', { to: phaserload.player.tradee, offer: phaserload.player.offer });

					phaserload.player.offer_accepted = phaserload.player.offer_sent_accept = 0;

					redraw = 1;
				}
			}

			else if(phaserload.hud.isOpen.view.includes('Offer')){
				item = Object.keys(phaserload.player.offer)[selection + (phaserload.hud.isOpen.view.includes('pg') ? (parseInt(phaserload.hud.isOpen.view.slice(-1)) - 1) * 7 : 0)];

				if(item){
					bottomLineText = 'Revoking '+ util.capitalize((item.includes(':~:') ? item.split(':~:')[2] : item), 1, '_');

					--phaserload.player.offer[item];

					if(!phaserload.player.offer[item]) delete phaserload.player.offer[item];

					socketClient.reply('player_update_offer', { to: phaserload.player.tradee, offer: phaserload.player.offer });

					phaserload.player.offer_accepted = phaserload.player.offer_sent_accept = 0;

					redraw = 1;
				}
			}
		}

		if(bottomLineText) phaserload.hud.bottomLine.setText(bottomLineText);

		phaserload.hud.justSelectedItem_TO = setTimeout(function(){
			phaserload.hud.justSelectedItem = false;

			if(phaserload.hud.isOpen.name === 'spaceco') phaserload.spaceco.updateBottomLine();

			if(redraw) phaserload.hud.useMenu(redraw);
		}, timeout);
	};
};