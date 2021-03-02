import log from './logger';
import lang from './lang/index';
import GroundEntity from './entities/ground';
import MineralEntity from './entities/mineral';
import PlayerEntity from './entities/player';
import SpacecoEntity from './entities/spaceco';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

var phaserload = {
	blockPx: 64,
	config: {
		type: Phaser.AUTO,
		scene: {}
	},
	options: {},
	player: {},
	groups: {},
	layers: {
		ground: 1,
		interfaces: 10
	},
	view: {
		map: [],
		players: {}
	},
	groupNames: ['ground', 'fluid', 'mobs', 'items', 'interfaces'],
	soundNames: ['dig', 'hurt', 'pickup', 'console_open', 'alert', 'blip', 'coin'],
	init: function(){
		var clientHeight = document.body.clientHeight - 2;
		var clientWidth = document.body.clientWidth - 1;
		var minViewWidth = 10 * phaserload.blockPx;
		var minViewHeight = 8 * phaserload.blockPx;
		var scale = (clientWidth < minViewWidth ? minViewWidth / clientWidth : 1);

		if(clientHeight - minViewHeight < clientWidth - minViewWidth) scale = (clientHeight < minViewHeight ? minViewHeight / clientHeight : 1);

		phaserload.config.width = Math.max(minViewWidth, clientWidth * scale);
		phaserload.config.height = clientHeight * scale;

		phaserload.scale = scale;

		phaserload.game = new Phaser.Game(phaserload.config);
	},
	update: function(){
		phaserload.drawView();
	},
	mapPos: function(x, y){
		if(typeof x === 'object'){
			y = x.y;
			x = x.x;
		}

		return phaserload.state.world.map[x] !== undefined ? (phaserload.state.world.map[x][y] !== undefined ? phaserload.state.world.map[x][y] : phaserload.state.world.map[0][0]) : phaserload.state.world.map[0][0];
	},
	toGridPos: function(pos){
		if(typeof pos === 'object') pos = { x: Math.round((pos.x - 32) / 64), y: Math.round((pos.y - 32) / 64) };
		else pos = Math.round((pos - 32) / 64);

		return pos;
	},
	toPxPos: function(pos){
		if(typeof pos === 'object') pos = { x: (pos.x * 64) + 32, y: (pos.y * 64) + 32 };
		else pos = (pos * 64) + 32;

		return pos;
	},
	drawView: function(){
		const viewWidth = phaserload.toGridPos(phaserload.config.width), viewHeight = phaserload.toGridPos(phaserload.config.height);
		let bottom = Math.min(parseInt(phaserload.player.position.y + (viewHeight / 2)) + 2, phaserload.state.world.depth);
		let right = Math.min(parseInt(phaserload.player.position.x + (viewWidth / 2)) + 2, phaserload.state.world.width);
		let top = Math.max(0, (bottom - viewHeight) - 3), left = Math.max(0, (right - viewWidth) - 3);

		if((bottom - top) < viewHeight){
			if(top === 0) bottom += (viewHeight - (bottom - top)) + 1;
			else top -= (viewHeight - (bottom - top)) + 1;
		}

		if((right - left) < viewWidth){
			if(left === 0) right += (viewWidth - (right - left)) + 1;
			else left -= (viewWidth - (right - left)) + 1;
		}

		log()(`Drawing view ${((bottom - top) + 1) * ((right - left) + 1)} sprites, from: x ${left} y ${top} TO x ${right} y ${bottom}`);

		phaserload.drawPlayers();
		phaserload.drawSpaceco();

		for(let x = left, y; x <= right; ++x) for(y = top; y <= bottom; ++y) phaserload.drawTile(x, y);

		if(!phaserload.player.console.isOpen) phaserload.player.console.draw_small();
	},
	drawPlayers: function(){
		phaserload.state.playerNames.forEach((name) => {
			if(name === phaserload.player.name) phaserload.player = Object.assign(phaserload.player, phaserload.state.players[name]);

			const { x, y } = phaserload.state.players[name].position;
			const px_x = phaserload.toPxPos(x), px_y = phaserload.toPxPos(y);

			if(!phaserload.view.players[name]){
				if(name === phaserload.player.name) phaserload.player.sprite = phaserload.view.players[name] = new PlayerEntity(x, y, name);
				else phaserload.view.players[name] = new DrillEntity(x, y, name);
			}

			else if(phaserload.view.players[name].x !== px_x || phaserload.view.players[name].y !== px_y){
				const halfPi = Math.PI / 2, positions = {
					right: {
						flipX: false,
						rotation: 0
					},
					left: {
						flipX: true,
						rotation: 0
					},
					up_left: {
						flipX: true,
						rotation: halfPi
					},
					up_right: {
						flipX: false,
						rotation: -halfPi
					},
					down_left: {
						flipX: true,
						rotation: -halfPi
					},
					down_right: {
						flipX: false,
						rotation: halfPi
					}
				};

				let direction, { lastDirection = 'right' } = phaserload.view.players[name];

				if(phaserload.view.players[name].x !== px_x){
					direction = phaserload.view.players[name].x > px_x ? 'left' : 'right';
				}
				else if(phaserload.view.players[name].y !== px_y){
					direction = phaserload.view.players[name].y > px_y ? 'up' : 'down';

					if(/up|down/.test(lastDirection)){
						if(new RegExp(direction).test(lastDirection)) direction = lastDirection;
						else direction += `_${/left/.test(lastDirection) ? 'right' : 'left'}`;
					}
					else direction += `_${lastDirection}`;
				}

				if(direction !== lastDirection){
					phaserload.view.players[name].lastDirection = direction;
					phaserload.view.players[name].flipX = positions[direction].flipX;
					phaserload.view.players[name].rotation = positions[direction].rotation;
				}

				const old_x = phaserload.toGridPos(phaserload.view.players[name].x), old_y = phaserload.toGridPos(phaserload.view.players[name].y);

				if(name === phaserload.player.name){
					if(phaserload.player.digging){
						phaserload.scene.sound.stopByKey('dig');
						phaserload.scene.sound.play('dig', { rate: (phaserload.scene.sound.get('dig').duration * 1000) / (phaserload.player.moveTime + 250) });
					}

					phaserload.adjustViewPosition(px_x, px_y, phaserload.player.moveTime);

					if(!phaserload.player.alertedFuel && phaserload.player.fuel.available <= 10){
						phaserload.player.alertedFuel = true;
						phaserload.player.console.notify(phaserload.player.fuel.available ? 'Out of fuel!' : 'Fuel is low!');
					}

					if(!phaserload.player.alertedCargo && phaserload.player.cargoBay.available <= 10){
						phaserload.player.alertedCargo = true;
						phaserload.player.console.notify(phaserload.player.cargoBay.available <= 1 ? 'Cargo bay is full!' : 'Cargo bay almost full!');
					}

					if(!phaserload.player.alertedHealth && phaserload.player.health.available <= 10){
						phaserload.player.alertedHealth = true;
						phaserload.player.console.notify(phaserload.player.health.available <= 1 ? 'You are dead!' : 'Health is low!');
					}
				}

				phaserload.scene.tweens.add({
					targets: phaserload.view.players[name],
					x: px_x,
					y: px_y,
					duration: phaserload.state.players[name].moveTime,// * Math.max(1, Math.abs(old_x - x) + Math.abs(old_y - y) - 1),
					ease: 'Linear',
					onComplete: () => {
						if(name === phaserload.player.name) phaserload.player.midMove = false;
					}
				});
			}
		});
	},
	drawSpaceco: function(){
		const { x, y } = phaserload.state.world.spaceco.position;
		const px_x = phaserload.toPxPos(x), px_y = phaserload.toPxPos(y);

		if(!phaserload.view.spaceco) phaserload.view.spaceco = new SpacecoEntity(x, y);

		else{
			if(phaserload.view.spaceco.x !== px_x || phaserload.view.spaceco.y !== px_y){
				const old_x = phaserload.toGridPos(phaserload.view.spaceco.x), old_y = phaserload.toGridPos(phaserload.view.spaceco.y);

				phaserload.scene.tweens.add({
					targets: phaserload.view.spaceco,
					x: px_x,
					y: px_y,
					duration: phaserload.state.world.gravity * (Math.abs(old_x - x) + Math.abs(old_y - y)),
					ease: 'Linear',
					onComplete: () => { phaserload.view.spaceco.setFrame(`spaceco_hurt${phaserload.state.world.spaceco.damage}`); }
				});
			}

			else phaserload.view.spaceco.setFrame(`spaceco_hurt${phaserload.state.world.spaceco.damage}`);
		}
	},
	adjustViewPosition: function(px_x, px_y, time = 2000){
		log()('adjustViewPosition', px_x, px_y, time);

		var scrollX = Math.max(0, Math.min(phaserload.toPxPos(phaserload.state.world.width) - phaserload.config.width - 32, px_x - (phaserload.config.width / 2)));
		var scrollY = Math.max(0, Math.min(phaserload.toPxPos(phaserload.state.world.depth) - phaserload.config.height - 32, px_y - (phaserload.config.height / 2)));;

		//todo world wrap?

		if(phaserload.initialized){
			const xDiff = phaserload.scene.cameras.main.scrollX - scrollX;
			const yDiff = phaserload.scene.cameras.main.scrollY - scrollY;

			log()(`Moving from ${phaserload.scene.cameras.main.scrollX} ${phaserload.scene.cameras.main.scrollY} to ${scrollX} ${scrollY}`);
			log()(`Moving: ${xDiff !== 0 ? (xDiff < 0 ? 'right' : 'left') : (yDiff !== 0 ? (yDiff < 0 ? 'down' : 'up') : 'nowhere')}`);

			const viewWidth = phaserload.toGridPos(phaserload.config.width), viewHeight = phaserload.toGridPos(phaserload.config.height);
			const old_x = phaserload.toGridPos(phaserload.scene.cameras.main.scrollX), old_y = phaserload.toGridPos(phaserload.scene.cameras.main.scrollY);

			if(xDiff !== 0){
				let x;

				if(xDiff < 0 && old_x > 0) x = old_x - 1;
				else if(xDiff > 0 && old_x + viewWidth < phaserload.state.world.width - 1) x = old_x + viewWidth + 1;

				if(typeof x !== 'undefined'){
					log()(`Kill sprite column: ${x}`);

					for(let y = Math.max(0, old_y - 2); y < Math.min(old_y + viewHeight + 2, phaserload.view.map[x].length); ++y){
						phaserload.killTile(x, y);
					}
				}
			}

			if(yDiff !== 0){
				let y;

				if(yDiff < 0 && old_y > 0) y = old_y - 1;
				else if(yDiff > 0 && old_y + viewHeight < phaserload.state.world.depth - 1) y = old_y + viewHeight + 1;

				if(typeof y !== 'undefined'){
					log()(`Kill sprite row: ${y}`);

					for(let x = Math.max(0, old_x - 2); x < Math.min(old_x + viewWidth + 2, phaserload.view.map[old_x].length); ++x){
						phaserload.killTile(x, y);
					}
				}
			}
		}

		phaserload.scene.tweens.add({
			targets: phaserload.scene.cameras.main,
			scrollX,
			scrollY,
			duration: time,
			ease: 'Linear'
		});
	},
	killTile: function(x, y){
		if(phaserload.view.map[x] && phaserload.view.map[x][y]){
			if(phaserload.view.map[x][y].ground.sprite) phaserload.view.map[x][y].ground.sprite.destroy()

			if(phaserload.view.map[x][y].ground.mineral) phaserload.view.map[x][y].ground.mineral.destroy();

			phaserload.view.map[x][y] = undefined;
		}
	},
	drawTile: function(x, y, id, animation){
		var { ground, items } = phaserload.mapPos(x, y);

		if(!phaserload.view.map[x]) phaserload.view.map[x] = [];

		if(!phaserload.view.map[x][y]){
			phaserload.view.map[x][y] = {
				ground: {},
				// items: []
			};
		}

		if(phaserload.view.map[x][y].ground.type !== ground.type){
			if(!ground.type && phaserload.view.map[x][y].ground.sprite){
				phaserload.view.map[x][y].ground.sprite.dig(phaserload.player.moveTime);

				if(phaserload.view.map[x][y].ground.mineral){
					phaserload.scene.sound.play('pickup');

					phaserload.view.map[x][y].ground.mineral.collect();
				}
			}

			phaserload.view.map[x][y].ground.type = ground.type;

			if(ground.type) phaserload.view.map[x][y].ground.sprite = new GroundEntity(x, y, ground.type);

			if(ground.mineral) phaserload.view.map[x][y].ground.mineral = new MineralEntity(x, y, ground.type);
		}

		if(animation) entity.anims.play(animation);
	}
};