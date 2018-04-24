/* global Phaser, Game, Log, Cjs */

Game.entities.lava = function(x, y){
	Phaser.Sprite.call(this, Game.phaser, Game.toPx(x), Game.toPx(y), 'lava');

	this.anchor.setTo(0.5, 0.5);

	var fillAnim = this.animations.add('fill', [0, 1, 2], 3, false);
	fillAnim.onComplete.add(function(){
		this.play('full');
	}, this);

	return this;
};

Game.entities.lava.prototype = Object.create(Phaser.Sprite.prototype);
Game.entities.lava.prototype.constructor = Game.entities.lava;

Game.entities.lava.create = function(x, y, spread){
	var lava = Game.lava.getFirstDead();

	if(!lava){
		lava = Game.lava.add(new Game.entities.lava(x, y));
	}

	else{
		lava.reset(Game.toPx(x), Game.toPx(y));
		lava.revive();
		lava.animations.stop();
		lava.animations.getAnimation('full').destroy();
	}

	var fullAnim = lava.animations.add('full', [3, 4, 5], 5, !spread);

	if(spread){
		fullAnim.onComplete.add(function(){
			Game.entities.lava.spread(lava);

			lava.animations.getAnimation('full').destroy();
			lava.animations.add('full', [3, 4, 5], 5, true);
			lava.animations.play('full');
		}, lava);
	}

	else{
		lava.animations.play('full');
	}

	Game.config.map[x][y].ground.name = 'lava';
	Game.config.map[x][y].ground.base = 'lava';
	Game.config.map[x][y].ground.variant = 'lava';
	Game.config.map[x][y].ground.sprite = lava;

	return lava;
};

Game.entities.lava.spread = function(lava){
	var pos = Game.toGridPos(lava);

	var surrounds = Game.getSurrounds(pos, { left: 1, right: 1, bottom: 1 });

	if(pos.x - 1 >= 0 && (!surrounds.left || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.left])){
		if(surrounds.left === 'ground_red' && Cjs.chance(80)) return;

		Game.setMapPos({ x: pos.x - 1, y: pos.y }, 'lava', 'fill');
	}

	if(pos.x + 1 < Game.config.width && (!surrounds.right || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.right])){
		if(surrounds.right === 'ground_red' && Cjs.chance(80)) return;

		Game.setMapPos({ x: pos.x + 1, y: pos.y }, 'lava', 'fill');
	}

	if(pos.y + 1 < Game.config.depth - 2 && (!surrounds.bottom || { purple_monster: 1, red_monster: 1, ground_red: 1 }[surrounds.bottom])){
		if(surrounds.bottom === 'ground_red' && Cjs.chance(40)) return;

		Game.setMapPos({ x: pos.x, y: pos.y + 1 }, 'lava', 'fill');
	}
};