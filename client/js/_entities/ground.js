/* global Phaser, Game */

Game.entities.ground = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, x, y, 'ground');

	this.anchor.setTo(0.5, 0.5);
};

Game.entities.ground.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.ground.prototype.constructor = Game.entities.ground;

Game.entities.ground.types = ['white', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink', 'red', 'black'];

Game.entities.ground.create = function(x, y, type){
	var ground = null;//Game.ground.getFirstDead();//causes issues

	if(ground === null){
		ground = Game.ground.add(new Game.entities.ground(x, y));
	}
	else{
		ground.reset(x, y);
		ground.revive();
	}

	if(!type){
		// type = Game.weightedChance(Game.config.world.layers[Math.ceil(Game.config.world.layers.length * (Game.toGridPos(y) / Game.config.depth)) - 1]);
		type = Game.weightedChance({ white: 90, red: 10 });

		Game.setMapPos({ x: x, y: y }, Game.mapNames.indexOf('ground_'+ type));
	}

	type = type.replace('ground_', '');

	ground.ground_type = type;
	ground.ground_type_ID = Game.entities.ground.types.indexOf(type);

	var frameMod = ground.ground_type_ID * 4;

	ground.frame = 0 + frameMod;

	var animation = ground.animations.add('crush', [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod], 10, false);
	animation.killOnComplete = true;

	return ground;
};

Game.entities.ground.crush = function(pos, fromServer){
	// console.log('crush: ', groundType, pos);
	Game.ground.forEachAlive(function(ground){
		if(ground.x === pos.x && ground.y === pos.y && !ground.animations.getAnimation('crush').isPlaying){//+ ground.ground_type
			var groundAt = Game.groundAt(pos.x, pos.y);
			if(!groundAt) return;

			var groundType = groundAt.replace('ground_', '');

			ground.tween = Game.phaser.add.tween(ground).to({ alpha: 0 }, Game.config.densities[groundType], Phaser.Easing.Cubic.In, true);
			ground.animations.play('crush');

			if(fromServer) return;

			Game.setMapPos(pos, -1);

			var gridPos = {
				x: Game.toGridPos(ground.x),
				y: Game.toGridPos(ground.y)
			};

			var surrounds = {
				left: Game.mapPosName(gridPos.x - 1, gridPos.y),
				top: Game.mapPosName(gridPos.x, gridPos.y - 1),
				right: Game.mapPosName(gridPos.x + 1, gridPos.y),
				bottom: Game.mapPosName(gridPos.x, gridPos.y + 1)
			};

			Game.entities.ground.releaseSurrounds(ground, surrounds, Game.config.densities[groundType]);
		}
	});
};

Game.entities.ground.releaseSurrounds = function(ground, surrounds, delay){
	setTimeout(function(){
		if({ poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.left]){
			Game.entities[surrounds.left].spread(ground.x - Game.blockPx, ground.y);
		}

		if({ noxious_gas: 1, lava: 1 }[surrounds.top]){
			Game.entities[surrounds.top].spread(ground.x, ground.y - Game.blockPx);
		}

		if({ poisonous_gas: 1, noxious_gas: 1, lava: 1 }[surrounds.right]){
			Game.entities[surrounds.right].spread(ground.x + Game.blockPx, ground.y);
		}

		if({ poisonous_gas: 1, noxious_gas: 1 }[surrounds.bottom]){
			Game.entities[surrounds.bottom].spread(ground.x, ground.y + Game.blockPx);
		}
	}, (delay || 100) + 1000);
};

Game.entities.ground.dig = function(pos){
	var type = Game.groundAt(pos.x, pos.y);

	// console.log('dig: ', type, pos);
	if(!type) return;

	type = type.replace('ground_', '');

	var blockActions = Game.config.groundEffects[type];
	if(blockActions && blockActions.includes('impenetrable')) return;

	Game.entities.ground.crush(pos);

	if(blockActions){
		Game.applyEffects(blockActions, pos);
		// blockAction = blockAction.split(':~:');
		// Game.entities.ground.applyBehavior(blockAction[0], blockAction[1], pos);
	}

	var isMineral = false;

	var drillPart = Game.player.configuration.drill.split(':~:');

	if(drillPart[0].includes('precision')) isMineral = Game.chance(5 * parseInt(drillPart[0].split('_')[1]));

	Game.effects.getHullItem((isMineral ? 'mineral_' : 'ground_') + type);
};

// Game.entities.ground.applyBehavior = function(name, options, pos){
// 	if(options) options = options.split(',');

// 	if({ poisonous_gas: 1, noxious_gas: 1, lava: 1, exploding: 1, freezing: 1 }[name]){
// 		if(!options) options = [null, pos];
// 		else options.push(pos);
// 	}

// 	if(Game.effects[name]) Game.effects[name].apply(null, options);
// };