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

	var animation = ground.animations.add('crush_'+ type, [0 + frameMod, 1 + frameMod, 2 + frameMod, 3 + frameMod], 10, false);
	animation.killOnComplete = true;

	return ground;
};

Game.entities.ground.crush = function(pos, fromServer){
	// console.log('crush: ', groundType, pos);
	Game.ground.forEachAlive(function(ground){
		if(ground.x === pos.x && ground.y === pos.y && !ground.animations.getAnimation('crush_'+ ground.ground_type).isPlaying){
			var groundAt = Game.groundAt(pos.x, pos.y);
			if(!groundAt) return;

			var groundType = groundAt.replace('ground_', '');

			ground.tween = Game.phaser.add.tween(ground).to({ alpha: 0 }, Game.config.densities[groundType], Phaser.Easing.Cubic.In, true);
			ground.animations.play('crush_'+ ground.ground_type);

			if(fromServer) return;

			// Socket.active.emit('crush_ground', pos);

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
		if(['gas', 'lava'].includes(surrounds.left)){
			Game.entities.lava.spread(ground.x - Game.blockPx, ground.y);
			Game.entities.gas.spread(ground.x - Game.blockPx, ground.y);
		}

		if(['lava'].includes(surrounds.top)){
			Game.entities.lava.spread(ground.x, ground.y - Game.blockPx);
		}

		if(['gas', 'lava'].includes(surrounds.right)){
			Game.entities.lava.spread(ground.x + Game.blockPx, ground.y);
			Game.entities.gas.spread(ground.x + Game.blockPx, ground.y);
		}

		if(['gas'].includes(surrounds.bottom)){
			Game.entities.gas.spread(ground.x, ground.y + Game.blockPx);
		}
	}, (delay || 100) + 1000);
};

Game.entities.ground.dig = function(pos){
	var type = Game.groundAt(pos.x, pos.y);

	// console.log('dig: ', type, pos);
	if(!type) return;

	type = type.replace('ground_', '');

	var blockAction = Game.config.groundEffects[type];
	if(blockAction === 'impenetrable') return;

	Game.entities.ground.crush(pos);

	if(blockAction){
		blockAction = blockAction.split(':~:');
		Game.entities.ground.applyBehavior(blockAction[0], blockAction[1], pos);
	}

	var groundWeight = 0.07 + (Game.config.densities[type] * 0.0001);

	if(type === 'red' || Game.player.hull.space < groundWeight) return;

	Game.player.hull.space -= groundWeight;

	Game.player.hull['ground_'+ type] = Game.player.hull['ground_'+ type] !== undefined ? Game.player.hull['ground_'+ type] : 0;

	Game.player.hull['ground_'+ type]++;
};

Game.entities.ground.applyBehavior = function(name, options, pos){
	if(options) options = options.split(',');

	if(['gas', 'lava', 'exploding', 'freezing'].includes(name)){
		if(!options) options = [null, pos];
		else options.push(pos);
	}

	if(Game.effects[name]) Game.effects[name].apply(null, options);
};