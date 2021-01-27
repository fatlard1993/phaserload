import phaserload from '../phaserload';

import util from 'js-util';
import Phaser from './node_modules/phaser/dist/phaser.min.js';

class GroundEntity extends Phaser.GameObjects.Sprite {
	constructor(x, y, type){
		super(phaserload.scene, phaserload.toPx(x), phaserload.toPx(y), 'map', `ground_${type}`);

		phaserload.groups.ground.add(this, true);

		this.setDepth(1);

		this.type = type;

		this.anims.create({
			key: 'dig',
			frames: this.anims.generateFrameNames('map', {
				prefix: `ground_${type}_dig`,
				start: 1,
				end: 3
			}),
			duration: phaserload.state.world.moveSpeed,//todo account for mineral density and player drill parts
			repeat: 0
		});
	}

	dig(){
		// var digEffects = phaserload.state.world.groundEffects[this.variant];

		// if(digEffects && digEffects.includes('impenetrable')) return;

		// if(digEffects) phaserload.applyEffects(digEffects, pos);

		// phaserload.setMapPos(pos);

		// var isMineral = false;

		// var drillPart = phaserload.player.configuration.drill.split(':~:'); //todo check ground density and drill capability for ability to drill through

		// if(drillPart[0].includes('precision')) isMineral = util.chance(5 * parseInt(drillPart[0].split('_')[1]));

		// phaserload.effects.getHullItem((isMineral ? 'mineral_' : 'ground_') + ground.variant);

		this.anims.play('dig', false);

		setTimeout(() => { this.destroy(); }, phaserload.state.world.moveSpeed);
	}
}




// phaserload.entities.ground = function(x, y, type){
// 	Phaser.Sprite.call(this, phaserload.game, phaserload.toPx(x), phaserload.toPx(y), 'map', type);

// 	this.anchor.setTo(0.5, 0.5);
// };

// phaserload.entities.ground.prototype = Object.create(Phaser.Sprite.prototype);
// phaserload.entities.ground.prototype.constructor = phaserload.entities.ground;

// phaserload.entities.ground.types = ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'];

// phaserload.entities.ground.create = function(x, y, type){
// 	var ground = phaserload.ground.add(new phaserload.entities.ground(x, y, type));

// 	phaserload.state.world.map[x][y].ground.name = type;

// 	type = type.replace('ground_', '');

// 	phaserload.state.world.map[x][y].ground.base = 'ground';
// 	phaserload.state.world.map[x][y].ground.variant = type;
// 	phaserload.state.world.map[x][y].ground.sprite = ground;

// 	// ground.frameMod = phaserload.entities.ground.types.indexOf(type) * 4;
// 	// ground.frame = 0 + ground.frameMod;

// 	// var digAnimation = ground.animations.add('dig', [0 + ground.frameMod, 1 + ground.frameMod, 2 + ground.frameMod, 3 + ground.frameMod], 10, false);
// 	var digAnimation = ground.animations.add('dig', Phaser.Animation.generateFrameNames('ground_'+ type +'_dig', 1, 3), 10, false);
// 	digAnimation.onComplete.add(function(){
// 		ground.destroy();
// 	}, ground);

// 	return ground;
// };

// phaserload.entities.ground.dig = function(pos){
// 	var ground = phaserload.mapPos(pos).ground;

// 	// Log()('dig: ', type, pos);
// 	if(!ground.name || ground.base !== 'ground') return;

// 	var blockActions = phaserload.state.world.groundEffects[ground.variant];

// 	if(blockActions && blockActions.includes('impenetrable')) return;

// 	if(blockActions) phaserload.applyEffects(blockActions, pos);

// 	// var surrounds = phaserload.getSurrounds(pos, { left: 1, top: 1, right: 1, bottom: 1 });

// 	// phaserload.releaseSurrounds(pos, surrounds, phaserload.state.world.densities[ground.variant]);

// 	phaserload.setMapPos(pos);

// 	var isMineral = false;

// 	var drillPart = phaserload.player.configuration.drill.split(':~:');

// 	if(drillPart[0].includes('precision')) isMineral = util.chance(5 * parseInt(drillPart[0].split('_')[1]));

// 	phaserload.effects.getHullItem((isMineral ? 'mineral_' : 'ground_') + ground.variant);
// };