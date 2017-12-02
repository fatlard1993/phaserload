/* global Phaser, Game, Log */

Game.entities.hud = function(game){};

Game.entities.hud.headingText = '            CONSOLE\n';

Game.entities.hud.create = function(x, y){
  var hud = Game.game.add.sprite(x, y, 'hud');

  hud.scale.setTo(0.4, 0.4);
  hud.fixedToCamera = true;

  hud.isOpen = false;

  hud.statusText = Game.game.add.text(20, 15, '', { font: '26px '+ Game.config.font, fill: Game.config.hudTextColor });
  hud.statusText.lineSpacing = -8;
  hud.addChild(hud.statusText);

  hud.interfaceText = Game.game.add.text(20, 20, '', { font: '13px '+ Game.config.font, fill: '#fff', fontWeight: 'bold' });
  hud.addChild(hud.interfaceText);

  hud.bottomLine = Game.game.add.text(20, 205, '', { font: '14px '+ Game.config.font, fill: Game.config.hudTextColor });
  hud.addChild(hud.bottomLine);

  return hud;
};

Game.entities.hud.update = function(){
  if(Game.hud.isOpen) return;

  Game.hud.interfaceText.setText('');
  Game.hud.bottomLine.setText('');

  var hudItemNames = Object.keys(Game.config.hudLayout), hudItemCount = hudItemNames.length;
  var statusText;
  var shortestLength = 1;
  var longestLength = 6;

  for(var x = 0; x < hudItemCount; x++){
    var item = hudItemNames[x];
    var value = Game.config.hudLayout[hudItemNames[x]].split(':~:');
    var spacer = (' '.repeat(value[0].length > shortestLength ? longestLength - (value[0].length - shortestLength) : longestLength));
    if(statusText) statusText += '\n'+ value[0] + spacer;
    else statusText = value[0] + spacer;

    if(item === 'position') statusText += 'x'+ Game.toGridPos(Game.config.players[Game.config.playerName].x) +' y'+ Game.toGridPos(Game.config.players[Game.config.playerName].y);
    else if(item === 'health') statusText += Game.toFixed(Game.health, 2);
    else if(item === 'fuel') statusText += Game.toFixed(Game.fuel, 2);
    else if(item === 'credits') statusText += Game.toFixed(Game.credits, 2);
    else if(item === 'hull') statusText += Game.toFixed(Game.hull.space, 2);
    else{
      if(item.startsWith('mineral') && Game.hull.items[item]) statusText += Game.hull.items[item];
    }
  }

  Game.hud.statusText.setText(statusText);
};

Game.entities.hud.open = function(name){
  Game.entities.hud.clear();

  if(name === 'hud') Game.entities.hud.openHud();
  else if(name === 'briefing'){
    name = 'hud';

    Game.entities.hud.openBriefing();
  }

  Game.hud.isOpen = name || 'unnamed';

  var scale = { x: 1.79, y: 1.79 };

  Game.game.add.tween(Game.hud.scale).to(scale, 600, Phaser.Easing.Circular.Out, true);
};

Game.entities.hud.close = function(){
  Game.hud.isOpen = false;

  if(Game.entities.hud.briefingOpen) Game.entities.hud.briefingOpen = false;

  if(Game.hud.emitter){
    Game.hud.emitter.destroy();
    Game.hud.emitter = null;
  }

  Game.hud.interfaceText.setText('');
  Game.hud.bottomLine.setText('');

  Game.game.add.tween(Game.hud.scale).to({ x: 0.5, y: 0.5 }, 600, Phaser.Easing.Circular.Out, true);

  Game.entities.hud.update();
};

Game.entities.hud.clear = function(){
  Game.hud.statusText.setText('');
  Game.hud.interfaceText.setText('');
};


Game.entities.hud.openHud = function(){
  Game.hud.interfaceText.setText(Game.entities.hud.headingText +'  Inventory  Hull      Exit\n');
};

Game.entities.hud.openBriefing = function(){
  Game.entities.hud.briefingOpen = true;

  Game.hud.interfaceText.setText(Game.entities.hud.headingText +'  Briefing   Help      Exit\n');
};

Game.entities.hud.setView = function(view){
  if(Game.hud.justSetView) return;
  Game.hud.justSetView = true;
  Game.hud.justSetView_TO = setTimeout(function(){ Game.hud.justSetView = false; }, 400);

  Game.hud.view = view;

  var menu = '';
  var items = '';
  var shortestLength = 5;
  var space = 20;

  var inventoryItemNames = Game.entities.hud.inventoryItemNames = Object.keys(Game.inventory), inventoryItemCount = inventoryItemNames.length;
  var hullItemNames = Game.entities.hud.hullItemNames = Object.keys(Game.hull.items), hullItemCount = hullItemNames.length;

  if(view === 'briefing'){
    menu = ' [Briefing]  Help      Exit\n';

    items = Game.config.world.briefing;
  }

  if(view === 'help'){
    menu = '  Briefing  [Help]     Exit\n';

    items = ' Tap the HUD to open your console\n   Tap Item Slots to use items\n   Dig until your hull is full\n Then take your load to spaceco\nWhile you\'re there buy some stuff';
  }

  if(view === 'inventory'){
    menu = ' ['+ (inventoryItemCount > 7 ? '   pg1   ' : 'Inventory') +'] Hull      Exit\n';

    for(var x = 0; x < Math.min(7, inventoryItemCount); x++){
      var itemName = inventoryItemNames[x];
      var slot = Game.itemSlot1.item === itemName ? 1 : Game.itemSlot2.item === itemName ? 2 : ' ';

      items += '['+ slot +'] '+ itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.inventory[itemName] +'\n';
    }
  }
  else if(view === 'inventory_pg2'){
    menu = ' [   pg2   ] Hull      Exit\n';

    for(var x = 7; x < Math.min(14, inventoryItemCount); x++){
      var itemName = inventoryItemNames[x];
      var slot = Game.itemSlot1.item === itemName ? 1 : Game.itemSlot2.item === itemName ? 2 : ' ';

      items += '['+ slot +'] '+ itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.inventory[itemName] +'\n';
    }
  }
  else if(view === 'inventory_pg3'){
    menu = ' [   pg3   ] Hull      Exit\n';

    for(var x = 14; x < inventoryItemCount; x++){
      var itemName = inventoryItemNames[x];
      var slot = Game.itemSlot1.item === itemName ? 1 : Game.itemSlot2.item === itemName ? 2 : ' ';

      items += '['+ slot +'] '+ itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.inventory[itemName] +'\n';
    }
  }
  else if(view === 'hull'){
    menu = '  Inventory ['+ (hullItemCount > 6 ? ' p1 ' : 'Hull') +']     Exit\n';

    items += 'Hull Space               '+ Game.toFixed(Game.hull.space, 2) +'\n';

    for(var x = 0; x < Math.min(6, hullItemCount); x++){
      var itemName = hullItemNames[x];

      items += itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.hull.items[itemName] +'\n';
    }
  }
  else if(view === 'hull_p2'){
    menu = '  Inventory [ p2 ]     Exit\n';

    for(var x = 6; x < Math.min(13, hullItemCount); x++){
      var itemName = hullItemNames[x];

      items += itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.hull.items[itemName] +'\n';
    }
  }
  else if(view === 'hull_p3'){
    menu = '  Inventory [ p3 ]     Exit\n';

    for(var x = 13; x < hullItemCount; x++){
      var itemName = hullItemNames[x];

      items += itemName + (' '.repeat(itemName.length > shortestLength ? space - (itemName.length - shortestLength) : space)) + Game.hull.items[itemName] +'\n';
    }
  }

  Game.hud.interfaceText.setText('            CONSOLE\n'+ menu + items);
};

Game.entities.hud.handlePointer = function(pointer){
  if(Game.hud.isOpen !== 'hud') return;

  if(pointer.y > 70 && pointer.y < 105){// menu
    if(pointer.x > 50 && pointer.x < 210){
      if(Game.entities.hud.briefingOpen){
        Log()('briefing');
        Game.entities.hud.setView('briefing');
      }
      else{
        Log()('inventory');
        if(Game.hud.view === 'inventory' && Object.keys(Game.inventory).length > 7) Game.entities.hud.setView('inventory_pg2');
        else if(Game.hud.view === 'inventory_pg2' && Object.keys(Game.inventory).length > 14) Game.entities.hud.setView('inventory_pg3');
        else Game.entities.hud.setView('inventory');
      }
    }
    else if(pointer.x > 220 && pointer.x < 300){
      if(Game.entities.hud.briefingOpen){
        Log()('help');
        Game.entities.hud.setView('help');
      }
      else{
        Log()('hull');

        if(Game.hud.view === 'hull' && Object.keys(Game.hull.items).length > 6) Game.entities.hud.setView('hull_p2');
        else if(Game.hud.view === 'hull_p2' && Object.keys(Game.hull.items).length > 13) Game.entities.hud.setView('hull_p3');
        else Game.entities.hud.setView('hull');
      }
    }
    else if(pointer.x > 360 && pointer.x < 500){
      Log()('exit');
      Game.entities.hud.close();
    }
  }

  var selectedItem;

  if(pointer.y > 110 && pointer.y < 140){
    if(Game.hud.view === 'inventory'){
      selectedItem = Game.entities.hud.inventoryItemNames[0];
    }
  }

  else if(pointer.y > 150 && pointer.y < 180){
    if(Game.hud.view === 'inventory'){
      selectedItem = Game.entities.hud.inventoryItemNames[1];
    }
  }

  else if(pointer.y > 190 && pointer.y < 220){
    if(Game.hud.view === 'inventory'){
      selectedItem = Game.entities.hud.inventoryItemNames[2];
    }
  }

  else if(pointer.y > 230 && pointer.y < 260){
    if(Game.hud.view === 'inventory'){
      selectedItem = Game.entities.hud.inventoryItemNames[3];
    }
  }

  else if(pointer.y > 270 && pointer.y < 300){
    if(Game.hud.view === 'inventory'){
      selectedItem = Game.entities.hud.inventoryItemNames[4];
    }
  }

  else if(pointer.y > 310 && pointer.y < 340){
    if(Game.hud.view === 'inventory'){
      selectedItem = Game.entities.hud.inventoryItemNames[5];
    }
  }

  Game.entities.hud.selectItem(selectedItem);
};

Game.entities.hud.selectItem = function(item){
  if(!item) return;

  if(Game.hud.justSelectedItem) return;
  Game.hud.justSelectedItem = true;
  Game.hud.justSelectedItem_TO = setTimeout(function(){ Game.hud.justSelectedItem = false; }, 400);

  var slot = Game.itemSlot1.item === item ? 2 : Game.itemSlot2.item === item ? -1 : 1;

  if(Game.itemSlot1.item === item) Game.entities.itemSlot.setItem(1, '');
  if(Game.itemSlot2.item === item) Game.entities.itemSlot.setItem(2, '');

  if(slot > 0){
    if(Game['itemSlot'+ slot].item && !Game['itemSlot'+ (slot === 1 ? 2 : 1)].item) slot = slot === 1 ? 2 : 1;
    else if(Game['itemSlot'+ slot].item) Game.entities.itemSlot.setItem(slot, '');

    Game.entities.itemSlot.setItem(slot, item);
  }

  Game.entities.hud.setView('inventory');
};