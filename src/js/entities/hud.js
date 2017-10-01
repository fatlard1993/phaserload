/* global Phaser, Game */

Game.entities.hud = function(game){};

Game.entities.hud.create = function(x, y){
  var hud = Game.game.add.sprite(x, y, 'hud');

  hud.scale.setTo(0.4, 0.4);
  hud.fixedToCamera = true;

  hud.isOpen = false;
  
  return hud;
};

Game.entities.hud.update = function(){
  if(Game.hud.isOpen) return;
  
  var hudItemNames = Object.keys(Game.config.hudContents[Game.config.mode]);
  for(var x = 0; x < Game.hudItemCount; x++){
    var item = hudItemNames[x];
    var value = Game.config.hudContents[Game.config.mode][hudItemNames[x]].split(':~:');
    var text = value[0] +': ';
    
    if(item === 'depth') text += Game.depth;
    else if(item === 'position_dbg') text += 'x'+ Game.toGridPos(Game.drill.x) +' y'+ Game.toGridPos(Game.drill.y);
    else if(item === 'position') text += 'x'+ (Game.toGridPos(Game.drill.x) + 1) +' y'+ -(Game.toGridPos(Game.drill.y) - Game.config.skyHeight);
    else if(item === 'fuel') text += Game.fuel.toFixed(1);
    else if(item === 'credits') text += Game.credits.toFixed(1);
    else if(item === 'hull') text += Game.hull.space.toFixed(1);
    else{
      if(item.startsWith('mineral') && Game.hull[item]) text += Game.hull[item];
    }

    // console.log('setting: ', 'hudLine'+ (x + 1), ' to: ', text);

    Game['hudLine'+ (x + 1)].setText(text);
  }
};

Game.entities.hud.open = function(){
  Game.entities.hud.clear();
  
  Game.hud.isOpen = true;

  var scale = { x: 1.5, y: 1.5 };

  if(Game.config.height <= 460) scale = { x: 1.2, y: 1.2 };
  
  Game.game.add.tween(Game.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
};

Game.entities.hud.close = function(){
  Game.hud.isOpen = false;
  
  Game.game.add.tween(Game.hud.scale).to({ x: 0.4, y: 0.4 }, 600, Phaser.Easing.Circular.Out, true);

  Game.entities.hud.update();
};

Game.entities.hud.clear = function(){
  for(var x = 0; x < Game.hudItemCount; x++){
    Game['hudLine'+ (x + 1)].setText('');
  }
};