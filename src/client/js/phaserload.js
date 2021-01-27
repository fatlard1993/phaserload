import log from './logger';
import lang from './lang/index';
import GroundEntity from './entities/ground';
import ItemEntity from './entities/item';
import MineralEntity from './entities/mineral';
import PlayerEntity from './entities/player';
import SpacecoEntity from './entities/spaceco';

import util from 'js-util';
import socketClient from 'socket-client';
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
	notify: function(text, timeout){
		if(phaserload.notifyText === text) return;

		if(phaserload.notify_TO){
			clearTimeout(phaserload.notify_TO);

			phaserload.hud.statusText.setText('');

			phaserload.notifyText = '';
		}

		phaserload.game.add.tween(phaserload.hud.scale).to({ x: 1.2, y: 1.2 }, 400, Phaser.Easing.Back.Out, true);

		phaserload.hud.statusText.setText(text);

		phaserload.notifyText = text;

		setTimeout(function(){
			if(phaserload.hud.isOpen) return;

			phaserload.game.add.tween(phaserload.hud.scale).to({ x: 0.5, y: 0.5 }, 400, Phaser.Easing.Circular.Out, true);
		}, 350);

		phaserload.notify_TO = setTimeout(function(){
			phaserload.notify_TO = null;

			phaserload.notifyText = null;

			if(phaserload.hud.isOpen) return;

			phaserload.hud.update();
		}, (timeout || 3) * 1000);
	},
	getSurrounds: function(pos, directionList, baseFilter){
		directionList = directionList || { left: 1, right: 1, farLeft: 1, farRight: 1, top: 1, topLeft: 1, topRight: 1, bottom: 1, bottomLeft: 1, bottomRight: 1 };

		var directions = Object.keys(directionList), count = directions.length, direction, xMod, yMod, ground;

		for(var x = 0; x < count; ++x){
			direction = directions[x];
			xMod = 0;
			yMod = 0;

			if({ left: 1, topLeft: 1, bottomLeft: 1, farLeft: 1 }[direction]) --xMod;
			if({ right: 1, topRight: 1, bottomRight: 1, farRight: 1 }[direction]) ++xMod;
			if({ farLeft: 1 }[direction]) --xMod;
			if({ farRight: 1 }[direction]) ++xMod;
			if({ top: 1, topLeft: 1, topRight: 1 }[direction]) --yMod;
			if({ bottom: 1, bottomLeft: 1, bottomRight: 1 }[direction]) ++yMod;

			ground = phaserload.mapPos(pos.x + xMod, pos.y + yMod).ground;

			directionList[direction] = baseFilter ? (baseFilter === ground.base ? ground.name : undefined) : ground.name;
		}

		return directionList;
	},
	getSurroundingRadius: function(pos, radius){
		var x_from = pos.x - radius, x_to = pos.x + radius;
		var y_from = pos.y - radius, y_to = pos.y + radius;
		var out = [];

		for(var x = x_from; x <= x_to; ++x){
			for(var y = y_from; y <= y_to; ++y){
				out.push({ x: x, y: y });
			}
		}

		return out;
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
	toPx: function(pos){
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

		for(let x = left, y; x <= right; ++x) for(y = top; y <= bottom; ++y) phaserload.drawTile(x, y);

		phaserload.drawPlayers();
		phaserload.drawSpaceco();

		if(!phaserload.player.console.isOpen) phaserload.player.console.draw_small();
	},
	drawPlayers: function(){
		phaserload.state.playerNames.forEach((name) => {
			if(name === phaserload.player.name) phaserload.player = Object.assign(phaserload.player, phaserload.state.players[name]);

			const { x, y } = phaserload.state.players[name].position;
			const px_x = phaserload.toPx(x), px_y = phaserload.toPx(y);

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

				phaserload.scene.tweens.add({
					targets: phaserload.view.players[name],
					x: px_x,
					y: px_y,
					duration: phaserload.player.moveSpeed,
					ease: 'Linear'
				});

				clearTimeout(phaserload.player.moveUnlock);

				setTimeout(() => { phaserload.player.midMove = false; }, phaserload.player.moveSpeed);
			}

			if(name === phaserload.player.name){
				phaserload.adjustViewPosition(px_x, px_y);

				//todo kill any sprites that arent in view
				//todo world wrap?
			}
		});
	},
	drawSpaceco: function(){
		const { x, y } = phaserload.state.world.spaceco.position;

		if(!phaserload.view.spaceco) phaserload.view.spaceco = new SpacecoEntity(x, y);
	},
	adjustViewPosition: function(px_x, px_y, time = 3000){
		log()('adjustViewPosition', px_x, px_y, time);

		var scrollX = Math.max(0, Math.min(phaserload.toPx(phaserload.state.world.width) - phaserload.config.width - 32, px_x - (phaserload.config.width / 2)));
		var scrollY = Math.max(0, Math.min(phaserload.toPx(phaserload.state.world.depth) - phaserload.config.height - 32, px_y - (phaserload.config.height / 2)));;

		//todo kill any sprites that arent in view

		phaserload.scene.tweens.add({
			targets: phaserload.scene.cameras.main,
			scrollX,
			scrollY,
			duration: phaserload.player.moveSpeed,
			ease: 'Linear'
		});
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
				phaserload.view.map[x][y].ground.sprite.dig();

				if(phaserload.view.map[x][y].ground.mineral) phaserload.view.map[x][y].ground.mineral.collect();
			}

			phaserload.view.map[x][y].ground.type = ground.type;

			if(ground.type) phaserload.view.map[x][y].ground.sprite = new GroundEntity(x, y, ground.type);

			if(ground.mineral) phaserload.view.map[x][y].ground.mineral = new MineralEntity(x, y, ground.type);
		}

		if(animation) entity.anims.play(animation);
	},
	god: function(){
		phaserload.player.credits = 999;

		phaserload.player.fuel = phaserload.player.max_fuel;
		phaserload.player.health = phaserload.player.max_health;

		phaserload.player.inventory = {
			'quadratic:~:tritanium:~:drill': 1,
			'precision_2:~:tritanium:~:drill': 1,
			'boosted_3:~:tritanium:~:tracks': 1,
			responder_teleporter: 99,
			timed_charge: 99,
			remote_charge: 99,
			timed_freeze_charge: 99,
			remote_freeze_charge: 99
		};
	}
};