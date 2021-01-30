import phaserload from '../phaserload';
import DrillEntity from './drill';
import ConsoleEntity from './console';
import ItemSlotEntity from './itemSlot';

import util from 'js-util';
import socketClient from 'socket-client';

class PlayerEntity extends DrillEntity {
	constructor(x, y, playerName){
		super(x, y, playerName);

		this.console = phaserload.player.console = new ConsoleEntity();
		phaserload.player.itemSlots = [new ItemSlotEntity(0)];

		phaserload.scene.input.keyboard.on('keydown', (evt) => {
			if({ W: 1, A: 1, S: 1, D: 1, UP: 1, DOWN: 1, LEFT: 1, RIGHT: 1 }[evt.keyPressed]) this.move({ W: 'UP', A: 'LEFT', S: 'DOWN', D: 'RIGHT' }[evt.keyPressed] || evt.keyPressed);
		});

		phaserload.scene.input.keyboard.on('keyup', (evt) => {
			if({ W: 1, A: 1, S: 1, D: 1, UP: 1, DOWN: 1, LEFT: 1, RIGHT: 1 }[evt.keyPressed]) this.stopMoving({ W: 'UP', A: 'LEFT', S: 'DOWN', D: 'RIGHT' }[evt.keyPressed] || evt.keyPressed);

			else if(evt.keyPressed === 'ESCAPE') phaserload.player.console.toggle();
		});

		phaserload.adjustViewPosition(phaserload.toPxPos(x), phaserload.toPxPos(y), 0);
	}

	move(direction){
		this.moving = direction;
	}

	stopMoving(direction){
		this.moving = null;
	}

	sendMove(x, y){
		phaserload.player.midMove = true;

		socketClient.reply('player_move', { name: this.playerName, x, y });
	}

	preUpdate(time, delta){
		super.preUpdate(time, delta);

		if(this.moving && !phaserload.player.midMove) this.sendMove(phaserload.player.position.x + { UP: 0, DOWN: 0, LEFT: -1, RIGHT: +1 }[this.moving], phaserload.player.position.y + { UP: -1, DOWN: 1, LEFT: 0, RIGHT: 0 }[this.moving]);

		return;

		if(!phaserload.initialized) return;

		// if(phaserload.player.sprite.emitter){// particle decay
		// 	phaserload.player.sprite.emitter.forEachAlive(function(particle){
		// 		particle.alpha = Math.max(0, Math.min(1, (particle.lifespan / phaserload.player.sprite.emitter.lifespan) * 2));
		// 	});
		// }
		var spriteGridPos = phaserload.toGridPos(phaserload.player.sprite);

		var playerCollision = phaserload.mapPos(spriteGridPos).ground.name;

		if(!phaserload.player.sprite.animations.getAnimation('teleport').isPlaying && typeof playerCollision === 'string'){
			log()('playerCollision', playerCollision);

			if(playerCollision === 'lava') phaserload.effects.hurt('lava', 12, 3);
			else if(playerCollision === 'poisonous_gas') phaserload.effects.hurt('poisonous_gas', 10, 5);
			else if(playerCollision === 'noxious_gas') phaserload.effects.disorient(3000);
			else if(playerCollision === 'red_monster') phaserload.effects.hurt('red_monster', 8, 3);
			else if(playerCollision === 'purple_monster') phaserload.effects.hurt('purple_monster', 6, 2);
		}

		if(!phaserload.game.tweens.isTweening(phaserload.player.sprite)){
			var moving, altDirection;
			var surrounds = phaserload.getSurrounds(phaserload.toGridPos(phaserload.player.sprite), undefined, 'ground');
			var hudIsTweening = phaserload.game.tweens.isTweening(phaserload.hud.scale);

			if(phaserload.game.input.activePointer.isDown){
				if(phaserload.hud.isOpen){//&& !phaserload.hud.justUsedItemSlot
					if(!hudIsTweening && (phaserload.game.input.activePointer.x > 575 || phaserload.game.input.activePointer.y > 460)) phaserload.hud.close();

					else if(!hudIsTweening) phaserload.hud.handlePointer(phaserload.game.input.activePointer);

					return;
				}

				else if(!phaserload.hud.isOpen && phaserload.game.math.distance(phaserload.game.input.activePointer.x, phaserload.game.input.activePointer.y, 70, 50) < 128){
					return phaserload.player.openHUD();
				}

				else if(phaserload.game.math.distance(phaserload.game.input.activePointer.x, phaserload.game.input.activePointer.y, phaserload.config.width - 32, 32) < 32){
					if(phaserload.hud.justUsedItemSlot || phaserload.hud.isOpen) return;

					phaserload.hud.justUsedItemSlot = true;
					phaserload.hud.justUsedItemSlot_TO = setTimeout(function(){ phaserload.hud.justUsedItemSlot = false; }, 500);

					if(!phaserload.itemSlot1.item) phaserload.hud.open('console');

					else phaserload.player.useItem(1, phaserload.itemSlot1.item);

					return;
				}

				else if(phaserload.game.math.distance(phaserload.game.input.activePointer.x, phaserload.game.input.activePointer.y, phaserload.config.width - 32, 106) < 32){
					if(phaserload.hud.justUsedItemSlot || phaserload.hud.isOpen) return;

					phaserload.hud.justUsedItemSlot = true;
					phaserload.hud.justUsedItemSlot_TO = setTimeout(function(){ phaserload.hud.justUsedItemSlot = false; }, 500);

					if(!phaserload.itemSlot2.item) phaserload.hud.open('console');

					else phaserload.player.useItem(2, phaserload.itemSlot2.item);

					return;
				}

				else{
					var xDiff = phaserload.player.sprite.x - phaserload.game.input.activePointer.x - phaserload.scene.cameras.main.x;
					var yDiff = phaserload.player.sprite.y - phaserload.game.input.activePointer.y - phaserload.scene.cameras.main.y;

					var xDirection = xDiff > 0 ? 'left' : 'right';
					var yDirection = yDiff > 0 ? 'up' : 'down';

					log()(xDiff, yDiff);

					xDiff = Math.abs(xDiff);
					yDiff = Math.abs(yDiff);

					moving = xDiff > yDiff ? (xDiff > 10 ? xDirection : null) : (yDiff > 10 ? yDirection : null);
					altDirection = xDiff > yDiff ? (yDiff > 10 ? yDirection : null) : (xDiff > 10 ? xDirection : null);
				}
			}

			else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.ESC) && !phaserload.justPressedEsc){
				phaserload.justPressedEsc = true;
				phaserload.justPressedEsc_TO = setTimeout(function(){ phaserload.justPressedEsc = false; }, 1000);

				if(phaserload.hud.isOpen) phaserload.hud.close();

				else phaserload.player.openHUD();

				return;
			}

			else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.ONE)){
				return phaserload.player.useItem(1, phaserload.itemSlot1.item);
			}
			else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.TWO)){
				return phaserload.player.useItem(2, phaserload.itemSlot2.item);
			}

			else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.LEFT) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.A)){
				moving = 'left';
			}
			else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.D)){
				moving = 'right';
			}
			else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.DOWN) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.S)){
				moving = 'down';
			}
			else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.UP) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.W)){
				moving = 'up';
			}

			var canMove;

			if(moving && phaserload.player.isDisoriented) moving = ['up', 'down', 'left', 'right'][util.randInt(0, 3)];

			if(moving) canMove = phaserload.player.checkMove(moving, surrounds);

			if(!canMove && altDirection){
				canMove = phaserload.player.checkMove(altDirection, surrounds);
				if(canMove) moving = altDirection;
			}

			if(!canMove) moving = null;

			if(moving) phaserload.player.move(moving, surrounds);

			else if(!phaserload.player.justMoved){
				if(!surrounds.left && !surrounds.right && !surrounds.bottom){
					var direction;

					if(phaserload.player.lastMove === 'up' && (surrounds.bottomLeft || surrounds.bottomRight)){
						direction = surrounds.bottomLeft && !surrounds.bottomRight ? 'left' : (surrounds.bottomLeft && surrounds.bottomRight ? (phaserload.player.lastMoveInvert ? 'left' : 'right') : 'right');

						log()('Automove from: '+ phaserload.player.lastMove +' to: '+ direction, surrounds);
					}
					else{
						direction = 'down';

						if(phaserload.player.lastMove === 'down') phaserload.effects.hurt('falling', 4, 3);

						log()('falling');
					}

					phaserload.player.move(direction);
				}
			}
		}
	}
}


// phaserload.entities.player = function(x, y){
// 	Phaser.Sprite.call(this, phaserload.game, phaserload.toPxPos(x), phaserload.toPxPos(y), 'map', 'drill_move1');

// 	this.anchor.setTo(0.5, 0.5);

// 	this.animations.add('move', Phaser.Animation.generateFrameNames('drill_move', 1, 3), 10, true);
// 	this.animations.add('teleport', Phaser.Animation.generateFrameNames('drill_teleport', 1, 3), 10, true);
// };

// phaserload.entities.player.prototype = Object.create(Phaser.Sprite.prototype);
// phaserload.entities.player.prototype.constructor = phaserload.entities.player;

// phaserload.entities.player.prototype.update = function(){
// 	if(!phaserload.initialized) return;

// 	// if(phaserload.player.sprite.emitter){// particle decay
// 	// 	phaserload.player.sprite.emitter.forEachAlive(function(particle){
// 	// 		particle.alpha = Math.max(0, Math.min(1, (particle.lifespan / phaserload.player.sprite.emitter.lifespan) * 2));
// 	// 	});
// 	// }
// 	var spriteGridPos = phaserload.toGridPos(phaserload.player.sprite);

// 	var playerCollision = phaserload.mapPos(spriteGridPos).ground.name;

// 	if(!phaserload.player.sprite.animations.getAnimation('teleport').isPlaying && typeof playerCollision === 'string'){
// 		log()('playerCollision', playerCollision);

// 		if(playerCollision === 'lava') phaserload.effects.hurt('lava', 12, 3);
// 		else if(playerCollision === 'poisonous_gas') phaserload.effects.hurt('poisonous_gas', 10, 5);
// 		else if(playerCollision === 'noxious_gas') phaserload.effects.disorient(3000);
// 		else if(playerCollision === 'red_monster') phaserload.effects.hurt('red_monster', 8, 3);
// 		else if(playerCollision === 'purple_monster') phaserload.effects.hurt('purple_monster', 6, 2);
// 	}

// 	if(!phaserload.game.tweens.isTweening(phaserload.player.sprite)){
// 		var moving, altDirection;
// 		var surrounds = phaserload.getSurrounds(phaserload.toGridPos(phaserload.player.sprite), undefined, 'ground');
// 		var hudIsTweening = phaserload.game.tweens.isTweening(phaserload.hud.scale);

// 		if(phaserload.game.input.activePointer.isDown){
// 			if(phaserload.hud.isOpen){//&& !phaserload.hud.justUsedItemSlot
// 				if(!hudIsTweening && (phaserload.game.input.activePointer.x > 575 || phaserload.game.input.activePointer.y > 460)) phaserload.hud.close();

// 				else if(!hudIsTweening) phaserload.hud.handlePointer(phaserload.game.input.activePointer);

// 				return;
// 			}

// 			else if(!phaserload.hud.isOpen && phaserload.game.math.distance(phaserload.game.input.activePointer.x, phaserload.game.input.activePointer.y, 70, 50) < 128){
// 				return phaserload.player.openHUD();
// 			}

// 			else if(phaserload.game.math.distance(phaserload.game.input.activePointer.x, phaserload.game.input.activePointer.y, phaserload.config.width - 32, 32) < 32){
// 				if(phaserload.hud.justUsedItemSlot || phaserload.hud.isOpen) return;

// 				phaserload.hud.justUsedItemSlot = true;
// 				phaserload.hud.justUsedItemSlot_TO = setTimeout(function(){ phaserload.hud.justUsedItemSlot = false; }, 500);

// 				if(!phaserload.itemSlot1.item) phaserload.hud.open('console');

// 				else phaserload.player.useItem(1, phaserload.itemSlot1.item);

// 				return;
// 			}

// 			else if(phaserload.game.math.distance(phaserload.game.input.activePointer.x, phaserload.game.input.activePointer.y, phaserload.config.width - 32, 106) < 32){
// 				if(phaserload.hud.justUsedItemSlot || phaserload.hud.isOpen) return;

// 				phaserload.hud.justUsedItemSlot = true;
// 				phaserload.hud.justUsedItemSlot_TO = setTimeout(function(){ phaserload.hud.justUsedItemSlot = false; }, 500);

// 				if(!phaserload.itemSlot2.item) phaserload.hud.open('console');

// 				else phaserload.player.useItem(2, phaserload.itemSlot2.item);

// 				return;
// 			}

// 			else{
// 				var xDiff = phaserload.player.sprite.x - phaserload.game.input.activePointer.x - phaserload.scene.cameras.main.x;
// 				var yDiff = phaserload.player.sprite.y - phaserload.game.input.activePointer.y - phaserload.scene.cameras.main.y;

// 				var xDirection = xDiff > 0 ? 'left' : 'right';
// 				var yDirection = yDiff > 0 ? 'up' : 'down';

// 				log()(xDiff, yDiff);

// 				xDiff = Math.abs(xDiff);
// 				yDiff = Math.abs(yDiff);

// 				moving = xDiff > yDiff ? (xDiff > 10 ? xDirection : null) : (yDiff > 10 ? yDirection : null);
// 				altDirection = xDiff > yDiff ? (yDiff > 10 ? yDirection : null) : (xDiff > 10 ? xDirection : null);
// 			}
// 		}

// 		else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.ESC) && !phaserload.justPressedEsc){
// 			phaserload.justPressedEsc = true;
// 			phaserload.justPressedEsc_TO = setTimeout(function(){ phaserload.justPressedEsc = false; }, 1000);

// 			if(phaserload.hud.isOpen) phaserload.hud.close();

// 			else phaserload.player.openHUD();

// 			return;
// 		}

// 		else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.ONE)){
// 			return phaserload.player.useItem(1, phaserload.itemSlot1.item);
// 		}
// 		else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.TWO)){
// 			return phaserload.player.useItem(2, phaserload.itemSlot2.item);
// 		}

// 		else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.LEFT) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.A)){
// 			moving = 'left';
// 		}
// 		else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.D)){
// 			moving = 'right';
// 		}
// 		else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.DOWN) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.S)){
// 			moving = 'down';
// 		}
// 		else if(phaserload.game.input.keyboard.isDown(Phaser.Keyboard.UP) || phaserload.game.input.keyboard.isDown(Phaser.Keyboard.W)){
// 			moving = 'up';
// 		}

// 		var canMove;

// 		if(moving && phaserload.player.isDisoriented) moving = ['up', 'down', 'left', 'right'][util.randInt(0, 3)];

// 		if(moving) canMove = phaserload.player.checkMove(moving, surrounds);

// 		if(!canMove && altDirection){
// 			canMove = phaserload.player.checkMove(altDirection, surrounds);
// 			if(canMove) moving = altDirection;
// 		}

// 		if(!canMove) moving = null;

// 		if(moving) phaserload.player.move(moving, surrounds);

// 		else if(!phaserload.player.justMoved){
// 			if(!surrounds.left && !surrounds.right && !surrounds.bottom){
// 				var direction;

// 				if(phaserload.player.lastMove === 'up' && (surrounds.bottomLeft || surrounds.bottomRight)){
// 					direction = surrounds.bottomLeft && !surrounds.bottomRight ? 'left' : (surrounds.bottomLeft && surrounds.bottomRight ? (phaserload.player.lastMoveInvert ? 'left' : 'right') : 'right');

// 					log()('Automove from: '+ phaserload.player.lastMove +' to: '+ direction, surrounds);
// 				}
// 				else{
// 					direction = 'down';

// 					if(phaserload.player.lastMove === 'down') phaserload.effects.hurt('falling', 4, 3);

// 					log()('falling');
// 				}

// 				phaserload.player.move(direction);
// 			}
// 		}
// 	}
// };

// phaserload.entities.player.create = function(settings){
// 	var playerSprite = phaserload.playersGroup.add(new phaserload.entities.player(settings.position.x, settings.position.y || 1));

// 	playerSprite.animations.play('move');

// 	phaserload.config.defaultPlayerScale = playerSprite.scale.x;

// 	return playerSprite;
// };

// phaserload.entities.player.init = function(){
// 	phaserload.player.move = function(direction, surrounds, position){
// 		log()('player moving: ', direction);

// 		if(phaserload.hud.isOpen) phaserload.hud.close();

// 		surrounds = surrounds || phaserload.getSurrounds(phaserload.toGridPos(phaserload.player.sprite));

// 		var newPosition = {}, newGridPos, newCameraPosition, moveTime, canMove = true;

// 		if(direction === 'teleport'){
// 			phaserload.player.sprite.animations.play('teleport');

// 			newPosition = phaserload.toPxPos(position);
// 			newGridPos = phaserload.toGridPos(newPosition);

// 			newCameraPosition = { x: newPosition.x - phaserload.config.width / 2, y: newPosition.y - phaserload.config.height / 2 };

// 			moveTime = Math.ceil(phaserload.game.math.distance(phaserload.player.sprite.x, phaserload.player.sprite.y, newPosition.x, newPosition.y));

// 			setTimeout(function(){
// 				phaserload.player.sprite.animations.play('move');
// 			}, 200 + moveTime);
// 		}

// 		else{
// 			newPosition = {
// 				x: phaserload.player.sprite.x + (direction === 'left' ? -phaserload.blockPx : direction === 'right' ? phaserload.blockPx : 0),
// 				y: phaserload.player.sprite.y + (direction === 'up' ? -phaserload.blockPx : direction === 'down' ? phaserload.blockPx : 0)
// 			};

// 			newGridPos = phaserload.toGridPos(newPosition);

// 			var targetGround = phaserload.mapPos(newGridPos).ground;
// 			moveTime = targetGround.base === 'ground' ? (phaserload.state.world.densities[targetGround.variant] ? phaserload.state.world.densities[targetGround.variant] - phaserload.player.drillSpeedMod : phaserload.player.baseMoveTime) : phaserload.player.baseMoveTime;

// 			if(direction === 'up' && Math.abs((phaserload.scene.cameras.main.y + phaserload.config.height) - phaserload.player.sprite.y) > phaserload.config.height / 2){
// 				newCameraPosition = { x: phaserload.scene.cameras.main.x, y: phaserload.scene.cameras.main.y - phaserload.blockPx };
// 			}
// 			else if(direction === 'down' && Math.abs(phaserload.scene.cameras.main.y - phaserload.player.sprite.y) > phaserload.config.height / 2){
// 				newCameraPosition = { x: phaserload.scene.cameras.main.x, y: phaserload.scene.cameras.main.y + phaserload.blockPx };
// 			}
// 			else if(direction === 'left' && Math.abs((phaserload.scene.cameras.main.x + phaserload.config.width) - phaserload.player.sprite.x) > phaserload.config.width / 2){
// 				newCameraPosition = { x: phaserload.scene.cameras.main.x - phaserload.blockPx, y: phaserload.scene.cameras.main.y };
// 			}
// 			else if(direction === 'right' && Math.abs(phaserload.scene.cameras.main.x - phaserload.player.sprite.x) > phaserload.config.width / 2){
// 				newCameraPosition = { x: phaserload.scene.cameras.main.x + phaserload.blockPx, y: phaserload.scene.cameras.main.y };
// 			}

// 			if(targetGround.base === 'ground'){
// 				canMove = !phaserload.state.world.groundEffects[targetGround.variant].includes('impenetrable');

// 				targetGround.sprite.dig();

// 				// phaserload.player.sprite.emitter = phaserload.game.add.emitter(0, 0, 100);
// 				// phaserload.player.sprite.addChild(phaserload.player.sprite.emitter);

// 				// var frameMod = phaserload.entities.ground.types.indexOf(targetGroundType.replace('ground_', '')) * 4;

// 				// phaserload.player.sprite.emitter.makeParticles('ground', [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod]);

// 				// phaserload.player.sprite.emitter.x = 32;

// 				// phaserload.player.sprite.emitter.setScale(0.1, 0.3, 0.1, 0.3);

// 				// phaserload.player.sprite.emitter.start(true, canMove ? moveTime + 100 : 150, null, Math.round(util.randInt(3, 7)));
// 			}

// 			else if({ lava: 1, gas: 1 }[targetGround.base]){
// 				phaserload.entities[targetGround.name].spread(targetGround.sprite);
// 			}

// 			var invertTexture = false;

// 			if(direction === 'up'){
// 				if(surrounds.left || surrounds.topLeft && !(surrounds.topRight && surrounds.topLeft && phaserload.player.lastMove === 'right')){
// 					invertTexture = true;
// 					phaserload.player.sprite.angle = 90;
// 				}
// 				else phaserload.player.sprite.angle = -90;
// 			}
// 			else if(direction === 'down'){
// 				if(surrounds.right || surrounds.bottomRight && !(surrounds.bottomRight && surrounds.bottomLeft && phaserload.player.lastMove === 'right')){
// 					invertTexture = true;
// 					phaserload.player.sprite.angle = -90;
// 				}
// 				else phaserload.player.sprite.angle = 90;
// 			}
// 			else{
// 				phaserload.player.sprite.angle = 0;
// 			}

// 			if(direction === 'left'){
// 				invertTexture = true;
// 			}

// 			if(invertTexture) phaserload.player.sprite.scale.x = -phaserload.config.defaultPlayerScale;
// 			else phaserload.player.sprite.scale.x = phaserload.config.defaultPlayerScale;

// 			phaserload.player.lastMoveInvert = invertTexture;
// 		}

// 		if(canMove){
// 			//if(targetGroundType && targetGroundType.startsWith('ground')) phaserload.scene.cameras.main.shake((moveTime * 0.00001) * 0.42, moveTime);

// 			if(phaserload.mapPos(newGridPos.x, newGridPos.y).items.names.length) phaserload.entities.item.interact(newGridPos);

// 			if(phaserload.player.hull.space < 0) moveTime += 250;

// 			moveTime = Math.max(200, moveTime);

// 			if(!direction.includes('teleport')) phaserload.effects.useFuel(moveTime * 0.0001, 0.01);

// 			phaserload.player.lastMove = direction;

// 			phaserload.player.lastPosition = newPosition;

// 			phaserload.game.add.tween(phaserload.player.sprite).to(newPosition, moveTime, Phaser.Easing.Sinusoidal.InOut, true);

// 			if(newCameraPosition) phaserload.adjustViewPosition(newCameraPosition.x, newCameraPosition.y, moveTime);

// 			socketClient.reply('player_move', { position: newPosition, moveTime: moveTime, direction: direction, invertTexture: invertTexture, angle: phaserload.player.sprite.angle });

// 			if(direction === 'down'){
// 				var newDepth = newGridPos.y;

// 				if(phaserload.achievements['depth'+ newDepth]) phaserload.getAchievement('depth'+ newDepth);
// 			}
// 		}

// 		if(phaserload.player.hull.space < 1.5) phaserload.notify('Your Hull is\nalmost full');

// 		if(phaserload.game.math.distance(newPosition.x, newPosition.y, phaserload.spaceco.sprite.x, phaserload.spaceco.sprite.y) < phaserload.blockPx + 10){
// 			phaserload.notify('Open to connect\nto Spaceco', 4);

// 			phaserload.player.tradee = ':~:spaceco:~:';
// 		}

// 		else{
// 			var tradePlayer, playerNames = Object.keys(phaserload.players);

// 			for(var x = 0; x < playerNames.length; ++x){
// 				if(playerNames[x] === phaserload.player.name) continue;

// 				var potentialTraderSprite = phaserload.players[playerNames[x]].sprite;
// 				if(newPosition.x === potentialTraderSprite.x && newPosition.y === potentialTraderSprite.y) tradePlayer = playerNames[x];
// 			}

// 			// if(!tradePlayer && phaserload.hud.isOpen) phaserload.hud.close();

// 			// else
// 			if(tradePlayer){
// 				phaserload.notify('Open to trade\nwith '+ tradePlayer, 4);

// 				phaserload.player.tradee = tradePlayer;
// 			}
// 			else phaserload.player.tradee = null;
// 		}

// 		setTimeout(function(){
// 			phaserload.hud.update();

// 			// if(phaserload.player.sprite.emitter){
// 			// 	phaserload.player.sprite.emitter.destroy();
// 			// 	phaserload.player.sprite.emitter = null;
// 			// }
// 		}, moveTime + 150);
// 	};

// 	phaserload.player.checkMove = function(direction, surrounds){
// 		var canMove = 1;

// 		if(direction === 'left' && (phaserload.player.sprite.x <= phaserload.blockPx/2 || (!surrounds.bottomLeft && !surrounds.bottom && !surrounds.farLeft))){
// 			canMove = 0;
// 		}
// 		else if(direction === 'right' && (phaserload.player.sprite.x >= (phaserload.state.mapData.width * 64) - 32 || (!surrounds.bottomRight && !surrounds.bottom && !surrounds.farRight))){
// 			canMove = 0;
// 		}
// 		else if(direction === 'down' && phaserload.player.sprite.y === phaserload.toPxPos(phaserload.state.mapData.depth - 2)){
// 			canMove = 0;
// 		}
// 		else if(direction === 'up' && (!surrounds.left && !surrounds.right && !surrounds.topLeft && !surrounds.topRight)){
// 			canMove = 0;
// 		}

// 		log()('can'+ (canMove ? '' : 't') +' move '+ direction);

// 		return canMove;
// 	};

// 	phaserload.player.useItem = function(slotNum, item){
// 		if(phaserload.player.justUsedItem || !phaserload['itemSlot'+ slotNum].item || phaserload['itemSlot'+ slotNum].item === '') return;

// 		if(phaserload.player.justUsedItem_TO){
// 			clearTimeout(phaserload.player.justUsedItem_TO);
// 			phaserload.player.justUsedItem_TO = null;
// 		}

// 		if(!phaserload.player.justUsedItem_TO){
// 			phaserload.player.justUsedItem = true;
// 			phaserload.player.justUsedItem_TO = setTimeout(function(){
// 				phaserload.player.justUsedItem = false;
// 			}, 500);
// 		}

// 		if(item === 'teleporter' || item === 'repair_nanites'){
// 			phaserload.applyEffects(phaserload.config.items[item] && phaserload.config.items[item].useEffects ? phaserload.config.items[item].useEffects : [util.randFromArr(Object.keys(phaserload.effects))]);
// 		}

// 		else if(item.includes('charge')){
// 			if(phaserload.player.activeCharge){
// 				phaserload.notify('You have already\nplaced a charge');

// 				return;
// 			}

// 			var frame = 0;

// 			if(item.includes('freeze')) frame += 4;

// 			if(item.includes('remote')){
// 				frame += 2;

// 				phaserload.entities.itemSlot.setItem(slotNum, '');
// 				phaserload.entities.itemSlot.setItem(slotNum, 'detonator');
// 			}

// 			else{
// 				phaserload.player.charge_TO = setTimeout(function(){
// 					phaserload.player.activeCharge.frame++;

// 					phaserload.effects[phaserload.player.activeChargeType.includes('freeze') ? 'freeze' : 'explode']({ x: phaserload.player.activeCharge.x, y: phaserload.player.activeCharge.y }, phaserload.player.activeChargeType.includes('remote') ? 5 : 3);

// 					setTimeout(function(){
// 						phaserload.player.activeCharge.destroy();
// 						phaserload.player.activeCharge = null;
// 						phaserload.player.activeChargeType = null;
// 					}, 1000);
// 				}, 3*1000);
// 			}

// 			phaserload.player.activeChargeType = item;

// 			phaserload.player.activeCharge = phaserload.game.add.sprite(phaserload.player.sprite.x, phaserload.player.sprite.y, 'explosive');
// 			phaserload.player.activeCharge.anchor.setTo(0.5, 0);
// 			phaserload.player.activeCharge.frame = frame;
// 		}

// 		else if(item === 'detonator'){
// 			phaserload['itemSlot'+ slotNum].itemSprite.animations.play('use_detonator');

// 			phaserload.player.charge_TO = setTimeout(function(){
// 				phaserload.player.activeCharge.frame++;

// 				phaserload.effects[phaserload.player.activeChargeType.includes('freeze') ? 'freeze' : 'explode']({ x: phaserload.player.activeCharge.x, y: phaserload.player.activeCharge.y }, phaserload.player.activeChargeType.includes('remote') ? 5 : 3);

// 				setTimeout(function(){
// 					phaserload.entities.itemSlot.setItem(slotNum, '');

// 					if(phaserload.player.inventory[phaserload.player.activeChargeType] > 0) phaserload.entities.itemSlot.setItem(slotNum, phaserload.player.activeChargeType);

// 					phaserload.player.activeCharge.destroy();
// 					phaserload.player.activeCharge = null;
// 					phaserload.player.activeChargeType = null;
// 				}, 1000);
// 			}, 1000);
// 		}

// 		else if(item === 'responder_teleporter'){
// 			if(!phaserload.player.responder){
// 				phaserload.player.responder = phaserload.game.add.sprite(phaserload.player.sprite.x, phaserload.player.sprite.y, 'responder');
// 				phaserload.player.responder.anchor.setTo(0.5, 0);
// 				phaserload.player.responder.animations.add('active', [0, 1], 5, true);
// 				phaserload.player.responder.animations.play('active');

// 				phaserload.effects.teleport('spaceco');
// 			}

// 			else{
// 				phaserload.effects.teleport('responder');

// 				phaserload.player.responder.destroy();
// 				phaserload.player.responder = null;
// 			}
// 		}

// 		else{
// 			log()(item, ' not yet implemented use func');
// 		}

// 		if(item !== 'detonator'){
// 			if(item === 'responder_teleporter' && phaserload.player.responder) return;

// 			phaserload.effects.loseInvItem(item);

// 			if(!phaserload.player.inventory[item] && !item.includes('remote')) phaserload.entities.itemSlot.setItem(slotNum, '');
// 		}
// 	};

// 	phaserload.player.openHUD = function(){
// 		if(phaserload.player.tradee === ':~:spaceco:~:') phaserload.spaceco.open();

// 		else if(phaserload.player.tradee) phaserload.hud.open('trade');

// 		else phaserload.hud.open('console');
// 	};

// 	phaserload.player.kill = function(by){
// 		phaserload.loseDepth = phaserload.toGridPos(phaserload.player.sprite.y);
// 		phaserload.loseReason = by;

// 		socketClient.reply('player_death', { by: by, at: phaserload.loseDepth });

// 		phaserload.player.sprite.destroy();

// 		return phaserload.game.time.events.add(200, function(){ phaserload.game.state.start('end'); }, this);
// 	};

// 	phaserload.player.acceptOffer = function(){
// 		var itemNames = Object.keys(phaserload.player.tradeFor), x;

// 		for(x = 0; x < itemNames.length; ++x){
// 			phaserload.effects.getInvItem(itemNames[x], phaserload.player.tradeFor[itemNames[x]]);
// 		}

// 		itemNames = Object.keys(phaserload.player.offer);

// 		for(x = 0; x < itemNames.length; ++x){
// 			phaserload.effects.loseInvItem(itemNames[x], phaserload.player.offer[itemNames[x]]);
// 		}

// 		phaserload.player.tradee = null;

// 		phaserload.player.offer_accepted = phaserload.player.offer_sent_accept = 0;

// 		phaserload.player.offer = {};
// 		phaserload.player.tradeFor = {};

// 		phaserload.hud.close();
// 	};
// };