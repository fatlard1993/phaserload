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