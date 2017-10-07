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

  hud.bottomLine = Game.game.add.text(20, 205, '', { font: '14px '+ Game.config.font, fill: Game.config.hudTextColor });
  // hud.bottomLine.lineSpacing = -6;
  hud.addChild(hud.bottomLine);
  
  return hud;
};

Game.entities.hud.update = function(){
  if(Game.hud.isOpen) return;
  
  var hudItemNames = Object.keys(Game.modes[Game.mode].hudLayout), hudItemCount = hudItemNames.length;
  var statusText;
  var shortestLength = 1;
  var space = 4;

  for(var x = 0; x < hudItemCount; x++){
    var item = hudItemNames[x];
    var value = Game.modes[Game.mode].hudLayout[hudItemNames[x]].split(':~:');
    var spacer = (' '.repeat(value[0].length > shortestLength ? space - (value[0].length - shortestLength) : space));
    if(statusText) statusText += '\n'+ value[0] + spacer;
    else statusText = value[0] + spacer;
    
    if(item === 'position_dbg') statusText += 'x'+ Game.toGridPos(Game.drill.x) +' y'+ Game.toGridPos(Game.drill.y);
    else if(item === 'position') statusText += 'x'+ (Game.toGridPos(Game.drill.x) + 1) +' y'+ -(Game.toGridPos(Game.drill.y) - Game.skyHeight);
    else if(item === 'fuel') statusText += Game.fuel.toFixed(2);
    else if(item === 'credits') statusText += Game.credits.toFixed(2);
    else if(item === 'hull') statusText += Game.hull.space.toFixed(2);
    else{
      if(item.startsWith('mineral') && Game.hull[item]) statusText += Game.hull[item];
    }
  }

  Game.hud.statusText.setText(statusText);
};

Game.entities.hud.open = function(name){
  if(name === 'hud') Game.entities.hud.openHud();

  Game.entities.hud.clear();
  
  Game.hud.isOpen = name || 'unnamed';

  var scale = { x: 1.79, y: 1.79 };
  
  Game.game.add.tween(Game.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
};

Game.entities.hud.close = function(){
  Game.hud.isOpen = false;

  if(Game.hud.emitter){
    Game.hud.emitter.destroy();
    Game.hud.emitter = null;
  }

  Game.hud.interfaceText.setText('');
  Game.hud.bottomLine.setText('');
  
  Game.game.add.tween(Game.hud.scale).to({ x: 0.4, y: 0.4 }, 600, Phaser.Easing.Circular.Out, true);

  Game.entities.hud.update();
};

Game.entities.hud.clear = function(){
  Game.hud.statusText.setText('');
};


Game.entities.hud.openHud = function(){
  Game.infoLine.setText('');

  Game.hud.interfaceText.setText('            CONSOLE\n'+'  Inventory  Hull      Exit\n');
};

Game.entities.hud.setView = function(view){
  Game.hudView = view;

  var menu = '';
  var items = '';
  var shortestLength = 5;
  var space = 24;
  
  if(view === 'inventory'){
    menu = ' [Inventory] Hull      Exit\n';
    
    var itemNames = Object.keys(Game.inventory);
    
    for(var x = 0; x < itemNames.length; x++){
      items += itemNames[x] + (' '.repeat(itemNames[x].length > shortestLength ? space - (itemNames[x].length - shortestLength) : space)) + Game.hull[itemNames[x]] +'\n';
    }
  }
  if(view === 'hull'){
    menu = '  Inventory [ p1 ]     Exit\n';

    var mineralNames = ['space', 'mineral_green', 'mineral_blue', 'mineral_red'];
    
    for(var x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + (Game.hull[mineralNames[x]] || 0) +'\n';
    }
  }
  else if(view === 'hull_p2'){
    menu = '  Inventory [ p2 ]     Exit\n';

    var mineralNames = ['ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue'];
    
    for(var x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + (Game.hull[mineralNames[x]] || 0) +'\n';
    }
  }
  else if(view === 'hull_p3'){
    menu = '  Inventory [ p3 ]     Exit\n';

    var mineralNames = ['ground_purple', 'ground_pink', 'ground_black'];
    
    for(var x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + (Game.hull[mineralNames[x]] || 0) +'\n';
    }
  }

  Game.hud.interfaceText.setText('            CONSOLE\n'+ menu + items);
};

Game.entities.hud.handlePointer = function(pointer){
  if(Game.hud.isOpen !== 'hud') return;

  if(pointer.y > 70 && pointer.y < 110){// menu
    if(pointer.x > 50 && pointer.x < 210){
      console.log('inventory');
      Game.entities.hud.setView('inventory');
    }
    else if(pointer.x > 220 && pointer.x < 300){
      console.log('hull');      
      if(Game.hudView === 'hull') Game.entities.hud.setView('hull_p2');
      else if(Game.hudView === 'hull_p2') Game.entities.hud.setView('hull_p3');
      else Game.entities.hud.setView('hull');
    }
    else if(pointer.x > 360 && pointer.x < 500){
      console.log('exit');
      Game.entities.hud.close();
    }
  }

  else if(pointer.y > 120 && pointer.y < 150){
    if(Game.hudView === 'inventory'){
      console.log('inventory slot #1');
    }
  }

  else if(pointer.y > 160 && pointer.y < 200){
    if(Game.hudView === 'inventory'){
      console.log('inventory slot #2');
    }
  }

  else if(pointer.y > 210 && pointer.y < 240){
    if(Game.hudView === 'inventory'){
      console.log('inventory slot #3');
    }
  }

  else if(pointer.y > 250 && pointer.y < 280){
    if(Game.hudView === 'inventory'){
      console.log('inventory slot #4');
    }
  }

  else if(pointer.y > 290 && pointer.y < 320){
    if(Game.hudView === 'inventory'){
      console.log('inventory slot #5');
    }
  }
};