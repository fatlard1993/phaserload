/* global Phaser, Game, Log, Cjs */

Game.entities.lava = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'lava');

	this.anchor.setTo(0.5, 0.5);

	return this;
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

Game.entities.lava.create = function(x, y, isNew){
	var lava = Game.lava.getFirstDead();
	var fillingAnim;

	if(!lava){
		lava = Game.lava.add(new Game.entities.lava(x, y));

		lava.animations.add('full', [3, 4, 5], 6, true);
	}

	else{
		lava.reset(Game.toPx(x), Game.toPx(y));
		lava.revive();
		lava.animations.stop();
	}

	if(isNew){
		fillingAnim = lava.animations.add('filling', [0, 1, 2], 3, false);
		fillingAnim.onComplete.add(function(){
			lava.play('full');

			Game.entities.lava.spread(lava);
		}, lava);

		lava.animations.play('filling');

		// Game.setMapPos({ x: x, y: y }, 'lava', null, 'filling');
	}

	else{
		fillingAnim = lava.animations.add('filling', [0, 1, 2], 3, false);
		fillingAnim.onComplete.add(function(){
			lava.play('full');
		}, lava);

		lava.animations.play('full');
	}

	Game.config.map[x][y].ground.name = 'lava';
	Game.config.map[x][y].ground.base = 'lava';
	Game.config.map[x][y].ground.variant = 'lava';
	Game.config.map[x][y].ground.sprite = lava;

	return lava;
};

Game.entities.lava.spread = function(lava){
	var gridPos = Game.toGridPos(lava);

	var surrounds = Game.getSurrounds(gridPos, { left: 1, right: 1, bottom: 1 });

	if(gridPos.x - 1 >= 0 && (surrounds.left === undefined || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.left])){
		if(surrounds.left === 'ground_red' && Cjs.chance(80)) return;

		if(surrounds.left === 'ground_red') Game.setMapPos({ x: gridPos.x - 1, y: gridPos.y }, 'lava');
	}

	if(gridPos.x + 1 < Game.config.width && (surrounds.right === undefined || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.right])){
		if(surrounds.right === 'ground_red' && Cjs.chance(80)) return;

		if(surrounds.right === 'ground_red') Game.setMapPos({ x: gridPos.x + 1, y: gridPos.y }, 'lava');
	}

	if(gridPos.y + 1 < Game.config.depth - 2 && (surrounds.bottom === undefined || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.bottom])){
		if(surrounds.bottom === 'ground_red' && Cjs.chance(40)) return;

		if(surrounds.bottom === 'ground_red') Game.setMapPos({ x: gridPos.x, y: gridPos.y + 1 }, 'lava');
	}
};