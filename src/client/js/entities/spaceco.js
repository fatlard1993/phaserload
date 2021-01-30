import phaserload from '../phaserload';

import util from 'js-util';
import socketClient from 'socket-client';
import Phaser from './node_modules/phaser/dist/phaser.min.js';

var BaseGroundValue = 0.5;	// todo make these a mode setting
var BaseMineralValue = 2.5;

class SpacecoEntity extends Phaser.GameObjects.Sprite {
	constructor(x, y){
		super(phaserload.scene, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', `spaceco_hurt${phaserload.state.world.spaceco.damage}`);

		phaserload.groups.mobs.add(this, true);

		this.setOrigin(0.5, 0.65);

		this.setDepth(phaserload.layers.ground + 1);
	}
}

// phaserload.entities.spaceco.init = function(){
// 	phaserload.spaceco.sprite = phaserload.entities.spaceco.create(phaserload.spaceco);

// 	phaserload.spaceco.boot = function(){
// 		if(phaserload.hud.isOpen.name !== 'spaceco') return;

// 		// phaserload.spaceco.setInterfaceText('\n				Im sorry, but...\n			if you have no money\n		we simply cant help you.');

// 		phaserload.hud.open({
// 			name: 'spaceco',
// 			pageItems: ['Im sorry, but...', 'if you have no money', 'we simply cant help you.']
// 		});

// 		setTimeout(phaserload.hud.close, 3 * 1000);
// 	};

// 	phaserload.spaceco.open = function(){
// 		if(phaserload.hud.isOpen) return;

// 		phaserload.hud.open({
// 			name: 'spaceco',
// 			heading: 'SPACECO',
// 			pageItems: ['Welcome to Spaceco, we love you'],
// 			view: 'welcome'
// 		});

// 		phaserload.hud.bottomLine.setText('...');

// 		setTimeout(function(){
// 			var output = {
// 				name: 'spaceco',
// 				heading: 'SPACECO',
// 				menuItems: ['Rates', 'Fuel', 'Parts', 'Shop'],
// 				pageItems: [],
// 				view: 'welcome_2'
// 			};

// 			delete phaserload.player.hull.space;

// 			var hullItemNames = Object.keys(phaserload.player.hull);
// 			var statingCredits = phaserload.player.credits;
// 			var soldItems = {
// 				ground: 0,
// 				mineral: 0
// 			};
// 			var x;

// 			for(x = 0; x < hullItemNames.length; x++){
// 				phaserload.spaceco.resourceBay[hullItemNames[x]] = phaserload.spaceco.resourceBay[hullItemNames[x]] || 0;
// 				phaserload.spaceco.resourceBay[hullItemNames[x]] += phaserload.player.hull[hullItemNames[x]];

// 				var type = hullItemNames[x].replace(/_.*$/, '');
// 				soldItems[type] += phaserload.player.hull[hullItemNames[x]];

// 				// if(phaserload.player.hull[hullItemNames[x]] > 0) pageItem += hullItemNames[x] +': '+ phaserload.player.hull[hullItemNames[x]] +' * '+ phaserload.spaceco.getValue(hullItemNames[x]) +'\n';

// 				phaserload.player.credits += phaserload.player.hull[hullItemNames[x]] * phaserload.spaceco.getValue(hullItemNames[x]);
// 			}

// 			socketClient.reply('player_sell_minerals', { resourceBay: phaserload.spaceco.resourceBay });

// 			output.pageItems.push('Sold:');

// 			var soldItemNames = Object.keys(soldItems);

// 			for(x = 0; x < soldItemNames.length; ++x){
// 				output.pageItems.push(' '+ soldItems[soldItemNames[x]] +' x '+ soldItemNames[x] +'s');
// 			}

// 			output.pageItems.push('For '+ util.toFixed(phaserload.player.credits - statingCredits, 2) +' credits');

// 			phaserload.player.hull = {
// 				space: phaserload.player.max_hullSpace
// 			};

// 			if(phaserload.player.credits - 0.1 < 0){
// 				phaserload.spaceco.getOut_TO = setTimeout(phaserload.spaceco.boot, 30 * 1000);
// 			}

// 			phaserload.hud.open(output);
// 		}, 1500);
// 	};

// 	phaserload.spaceco.getValue = function(name){
// 		var value;

// 		if(name.startsWith('ground')){
// 			value = BaseGroundValue + (((phaserload.state.world.densities[name.replace('ground_', '')] * 0.7) - ((phaserload.spaceco.resourceBay[name] || 0) / 2)) / 500);
// 		}

// 		else if(name.startsWith('mineral')){
// 			value = BaseMineralValue + (((phaserload.state.world.densities[name.replace('mineral_', '')] * 0.7) - ((phaserload.spaceco.resourceBay[name] || 0) / 2)) / 100);
// 		}

// 		else if(phaserload.state.world.spaceco.fuel[name]){
// 			value = phaserload.state.world.spaceco.fuel[name];
// 		}

// 		else if(phaserload.state.world.spaceco.shop[name]){
// 			value = phaserload.state.world.spaceco.shop[name];
// 		}

// 		else if(phaserload.spaceco.parts[name]){
// 			value = phaserload.spaceco.parts[name];
// 		}

// 		return Math.max(0, value);
// 	};
// };