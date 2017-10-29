/* global Phaser, Game */

Game.entities.spaceco = function(game){};

Game.entities.spaceco.headingText = '             SPACECO\n';

Game.entities.spaceco.defaultPrices = {
  gas: 1,
  energy: 2,
  super_oxygen_liquid_nitrogen: 3,
  teleporter: 5,
  responder_teleporter: 10,
  repair: 40,
  upgrade: 10,
  transport: 100,
  timed_charge: 5,
  remote_charge: 10,
  timed_freeze_charge: 10,
  remote_freeze_charge: 15,
};

Game.entities.spaceco.create = function(){
  var spacecoX = Game.rand(3, Game.width - 3);

  var spaceco = Game.game.add.sprite(Game.toPx(spacecoX), Game.toPx(1), 'spaceco', 10);

  spaceco.frame = spaceco.damage = 0;

  spaceco.anchor.setTo(0.5, 0.65);

  spaceco.scale.setTo(0.25, 0.25);

  Game.entities.spaceco.resourceBay = {};

  return spaceco;
};

Game.entities.spaceco.setInterfaceText = function(text){
  Game.hud.interfaceText.setText(Game.entities.spaceco.headingText + text);
};

Game.entities.spaceco.welcome = function(cb){
  Game.entities.spaceco.setInterfaceText('\n\n Welcome to Spaceco, we love you');

  setTimeout(cb, 1500);
};

Game.entities.spaceco.boot = function(cb){
  if(Game.hud.isOpen !== 'spaceco') return;

  Game.entities.spaceco.setInterfaceText('\n        Im sorry, but...\n      if you have no money\n    we simply cant help you.');

  setTimeout(Game.entities.hud.close, 3*1000);
};

Game.entities.spaceco.getValue = function(name){
  var value;

  if(name.startsWith('ground')){
    value = Game.modes[Game.mode].baseGroundValue + (((Game.modes[Game.mode].digTime[name.replace('ground_', '')] / 2) - (Game.entities.spaceco.resourceBay[name] || 0)) / 1000);

    if(name === 'ground_green' && Game.mode === 'normal') value *= 2;
  }
  else if(name.startsWith('mineral')){
    value = Game.modes[Game.mode].mineralValues[name.replace('mineral_', '')] - ((Game.entities.spaceco.resourceBay[name] || 0) / 40);
  }

  return Math.max(0, value);
};

Game.entities.spaceco.open = function(){
  Game.entities.hud.open('spaceco');

  Game.entities.spaceco.welcome(function(){
    var menu = '   Rates  Fuel  Shop     Exit\n';
    var contents = '';

    if(Game.mode === 'normal'){
      delete Game.hull.space;

      var mineralNames = Object.keys(Game.hull);
      var statingCredits = Game.credits;
      var soldItems = {};
      var x;

      for(x = 0; x < mineralNames.length; x++){
        Game.entities.spaceco.resourceBay[mineralNames[x]] = Game.entities.spaceco.resourceBay[mineralNames[x]] || 0;
        Game.entities.spaceco.resourceBay[mineralNames[x]] += Game.hull[mineralNames[x]];

        var type = mineralNames[x].replace(/_.*$/, '');
        soldItems[type] = soldItems[type] || 0;
        soldItems[type]++;

        // if(Game.hull[mineralNames[x]] > 0) contents += mineralNames[x] +': '+ Game.hull[mineralNames[x]] +' * '+ Game.entities.spaceco.getValue(mineralNames[x]) +'\n';

        Game.credits += Game.hull[mineralNames[x]] * Game.entities.spaceco.getValue(mineralNames[x]);
      }

      contents += 'Sold:\n';

      var soldItemNames = Object.keys(soldItems);

      for(x = 0; x < soldItemNames.length; x++){
        contents += ' '+ soldItems[soldItemNames[x]] +' x '+ soldItemNames[x] +'s\n';
      }

      contents += 'For '+ (Game.credits - statingCredits).toFixed(2) +' credits';

      Game.hull = {};
      Game.hull.space = 10 * ((Game.drill.upgrade || 0) + 1);

      if(Game.credits === 0){
        Game.entities.spaceco.getOut_TO = setTimeout(Game.entities.spaceco.boot, 30*1000);
      }
    }

    Game.entities.spaceco.setInterfaceText(menu + contents);

    setTimeout(function(){
      Game.entities.spaceco.updateBottomLine();
    }, 500);
  });
};

Game.entities.spaceco.setView = function(view){
  if(Game.hud.isOpen !== 'spaceco') return;

  if(Game.hud.justSetView) return;
  Game.hud.justSetView = true;
  Game.hud.justSetView_TO = setTimeout(function(){ Game.hud.justSetView = false; }, 400);

  Game.hud.view = view;

  Game.entities.spaceco.updateBottomLine();

  var menu = '';
  var items = '';
  var shortestLength = 10;
  var space = 19;
  var mineralNames, x;

  if(view === 'rates'){
    menu = '  [ pg1 ] Fuel  Shop     Exit\n';

    mineralNames = ['ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue'];

    for(x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + Game.entities.spaceco.getValue(mineralNames[x]).toFixed(2) +'\n';
    }
  }
  else if(view === 'rates_pg2'){
    menu = '  [ pg2 ] Fuel  Shop     Exit\n';

    mineralNames = ['ground_purple', 'ground_pink', 'ground_black'];

    for(x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + Game.entities.spaceco.getValue(mineralNames[x]).toFixed(2) +'\n';
    }
  }
  else if(view === 'rates_pg3'){
    menu = '  [ pg3 ] Fuel  Shop     Exit\n';

    mineralNames = ['mineral_green', 'mineral_blue', 'mineral_red', 'mineral_purple', 'mineral_teal', 'mineral_???'];

    for(x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + Game.entities.spaceco.getValue(mineralNames[x]).toFixed(2) +'\n';
    }
  }
  else if(view === 'fuel'){
    menu = '   Rates [Fuel] Shop     Exit';
    items += '\nGas                          $'+ Game.entities.spaceco.prices.gas;
    items += '\nEnergy                       $'+ Game.entities.spaceco.prices.energy;
    items += '\nSuper Oxygen Liquid Nitrogen $'+ Game.entities.spaceco.prices.super_oxygen_liquid_nitrogen;
  }
  else if(view === 'shop'){
    menu = '   Rates  Fuel [ p1 ]    Exit';
    items += '\nTeleporter                   $'+ Game.entities.spaceco.prices.teleporter;
    items += '\nResponder Teleporter         $'+ Game.entities.spaceco.prices.responder_teleporter;
    items += '\nRepair                       $'+ Game.entities.spaceco.prices.repair;
    items += '\nUpgrade                      $'+ Game.entities.spaceco.prices.upgrade;
    items += '\nTransport                    $'+ Game.entities.spaceco.prices.transport;
  }
  else if(view === 'shop_p2'){
    menu = '   Rates  Fuel [ p2 ]    Exit';
    items += '\nTimed Charge                 $'+ Game.entities.spaceco.prices.timed_charge;
    items += '\nRemote Charge                $'+ Game.entities.spaceco.prices.remote_charge;
    items += '\nTimed Freeze Charge          $'+ Game.entities.spaceco.prices.timed_freeze_charge;
    items += '\nRemote Freeze Charge         $'+ Game.entities.spaceco.prices.remote_freeze_charge;
  }
  Game.entities.spaceco.spacecoFuel = '';
  Game.entities.spaceco.spacecoProducts = '';

  Game.entities.spaceco.setInterfaceText(menu + items);
};

Game.entities.spaceco.updateBottomLine = function(){
  if(Game.hud.isOpen !== 'spaceco') return;

  var credits = ' Credits: '+ Game.credits.toFixed(2);
  var fuel = '   Fuel: '+ Game.fuel.toFixed(2);

  Game.hud.bottomLine.setText(credits + fuel);
};

Game.entities.spaceco.handlePointer = function(pointer){
  if(Game.hud.isOpen !== 'spaceco') return;

  if(pointer.y > 70 && pointer.y < 110){// menu
    if(pointer.x > 70 && pointer.x < 165){
      if(Game.hud.view === 'rates') Game.entities.spaceco.setView('rates_pg2');
      if(Game.hud.view === 'rates_pg2') Game.entities.spaceco.setView('rates_pg3');
      else Game.entities.spaceco.setView('rates');
    }
    else if(pointer.x > 175 && pointer.x < 255){
      Game.entities.spaceco.setView('fuel');
    }
    else if(pointer.x > 265 && pointer.x < 350){
      if(Game.hud.view === 'shop') Game.entities.spaceco.setView('shop_p2');
      else Game.entities.spaceco.setView('shop');
    }
    else if(pointer.x > 400 && pointer.x < 500){
      Game.entities.hud.close();
    }
  }

  var selectedItem;

  if(pointer.y > 120 && pointer.y < 150){
    if(Game.hud.view === 'fuel'){
      selectedItem = 'gas';
    }
    else if(Game.hud.view === 'shop'){
      selectedItem = 'teleporter';
    }
    else if(Game.hud.view === 'shop_p2'){
      selectedItem = 'timed_charge';
    }
  }

  else if(pointer.y > 160 && pointer.y < 200){
    if(Game.hud.view === 'fuel'){
      selectedItem = 'energy';
    }
    else if(Game.hud.view === 'shop'){
      selectedItem = 'responder_teleporter';
    }
    else if(Game.hud.view === 'shop_p2'){
      selectedItem = 'remote_charge';
    }
  }
  else if(pointer.y > 210 && pointer.y < 240){
    if(Game.hud.view === 'fuel'){
      selectedItem = 'super_oxygen_liquid_nitrogen';
    }
    else if(Game.hud.view === 'shop'){
      selectedItem = 'repair';
    }
    else if(Game.hud.view === 'shop_p2'){
      selectedItem = 'timed_freeze_charge';
    }
  }

  else if(pointer.y > 250 && pointer.y < 280){
    if(Game.hud.view === 'shop'){
      selectedItem = 'upgrade';
    }
    else if(Game.hud.view === 'shop_p2'){
      selectedItem = 'remote_freeze_charge';
    }
  }

  else if(pointer.y > 290 && pointer.y < 320){
    if(Game.hud.view === 'shop'){
      selectedItem = 'transport';
    }
  }

  if(selectedItem){
    Game.entities.spaceco.selectItem(selectedItem);
    //idea::todo animate a sprite of the purchased thing going from the top to the bottom (from spaceco to the player)
  }
};

Game.entities.spaceco.selectItem = function(item){
  if(!item) return;

  if(Game.hud.justSelectedItem) return;
  Game.hud.justSelectedItem = true;
  Game.hud.justSelectedItem_TO = setTimeout(function(){ Game.hud.justSelectedItem = false; }, 400);

  if(Game.credits < Game.entities.spaceco.prices[item]) return;

  if(item === 'repair' && Game.health === 100 + (20 * ((Game.drill.upgrade || 0) + 1))) return;
  if(item === 'upgrade' && Game.drill.upgrade === 3) return;
  if(item === 'gas' && Game.drill.upgrade !== 0) return;
  if(item === 'energy' && Game.drill.upgrade !== 1) return;
  if(item === 'super_oxygen_liquid_nitrogen' && Game.drill.upgrade !== 2) return;

  Game.credits -= Game.entities.spaceco.prices[item];

  if(item === 'gas'){
    if(Game.drill.upgrade === 0) Game.fuel += 1.5;
  }
  else if(item === 'energy'){
    if(Game.drill.upgrade === 1) Game.fuel += 3.2;
  }
  else if(item === 'super_oxygen_liquid_nitrogen'){
    if(Game.drill.upgrade === 2) Game.fuel += 6.9;
  }
  else if(item === 'transport'){
    Game.purchasedTransport = true;

    Game.game.state.start('play');
  }
  else if(item === 'upgrade'){
    if(Game.drill.upgrade === 3) return;

    Game.drill.upgrade++;

    Game.drill.animations.play('upgrade_'+ Game.drill.upgrade);

    Game.hull.space = 10 * ((Game.drill.upgrade || 0) + 1);
  }
  else if(item === 'repair'){
    Game.health = 100 + (20 * ((Game.drill.upgrade || 0) + 1));
  }
  else{
    Game.inventory[item] = Game.inventory[item] || 0;
    Game.inventory[item]++;
  }

  Game.entities.spaceco.updateBottomLine();
};

Game.entities.spaceco.hurt = function(amount, by){
  if(Game.spaceco.justHurt) return; //todo make this depend on what the damage is from
  Game.spaceco.justHurt = true;
  Game.spaceco.justHurt_TO = setTimeout(function(){ Game.spaceco.justHurt = false; }, 500);

  Game.spaceco.damage += amount;

  if(Game.spaceco.damage > 9){
    setTimeout(function(){
      Game.spaceco.kill();

      Game.notify('Spaceco was killed by '+ by, 3);
    }, 400);
  }
  else Game.spaceco.frame = Game.spaceco.damage;
};