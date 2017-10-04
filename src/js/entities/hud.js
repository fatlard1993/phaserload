/* global Phaser, Game */

Game.entities.hud = function(game){};

Game.entities.hud.create = function(x, y){
  var hud = Game.game.add.sprite(x, y, 'hud');

  hud.scale.setTo(0.4, 0.4);
  hud.fixedToCamera = true;

  hud.isOpen = false;

  hud.statusText = Game.game.add.text(20, 15, '', { font: '35px '+ Game.config.font, fill: Game.config.hudTextColor });
  hud.statusText.lineSpacing = -8;
  hud.addChild(hud.statusText);

  hud.interfaceText = Game.game.add.text(20, 20, '', { font: '14px '+ Game.config.font, fill: '#fff', fontWeight: 'bold' });
  hud.addChild(hud.interfaceText);
  
  return hud;
};

Game.entities.hud.update = function(){
  if(Game.hud.isOpen) return;
  
  var hudItemNames = Object.keys(Game.modes[Game.mode].hudLayout), hudItemCount = hudItemNames.length;
  var statusText;

  for(var x = 0; x < hudItemCount; x++){
    var item = hudItemNames[x];
    var value = Game.modes[Game.mode].hudLayout[hudItemNames[x]].split(':~:');
    if(statusText) statusText += '\n'+ value[0] +': ';
    else statusText = value[0] +': ';
    
    if(item === 'position_dbg') statusText += 'x'+ Game.toGridPos(Game.drill.x) +' y'+ Game.toGridPos(Game.drill.y);
    else if(item === 'position') statusText += 'x'+ (Game.toGridPos(Game.drill.x) + 1) +' y'+ -(Game.toGridPos(Game.drill.y) - Game.skyHeight);
    else if(item === 'fuel') statusText += Game.fuel.toFixed(1);
    else if(item === 'credits') statusText += Game.credits.toFixed(1);
    else if(item === 'hull') statusText += Game.hull.space.toFixed(1);
    else{
      if(item.startsWith('mineral') && Game.hull[item]) statusText += Game.hull[item];
    }
  }

  Game.hud.statusText.setText(statusText);
};

Game.entities.hud.open = function(){
  Game.entities.hud.clear();
  
  Game.hud.isOpen = true;

  var scale = { x: 1.5, y: 1.5 };

  if(Game.viewHeight <= 460) scale = { x: 1.2, y: 1.2 };
  
  Game.game.add.tween(Game.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
};

Game.entities.hud.close = function(){
  Game.hud.isOpen = false;
  
  Game.game.add.tween(Game.hud.scale).to({ x: 0.4, y: 0.4 }, 600, Phaser.Easing.Circular.Out, true);

  Game.entities.hud.update();
};

Game.entities.hud.clear = function(){
  Game.hud.statusText.setText('');
};