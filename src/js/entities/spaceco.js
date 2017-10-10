/* global Phaser, Game */

Game.entities.spaceco = function(game){};

Game.entities.spaceco.headingText = '             SPACECO\n';

Game.entities.spaceco.create = function(){
  var spacecoX = Game.rand(3, Game.width - 3);

  var spaceco = Game.game.add.sprite(Game.toPx(spacecoX), Game.toPx(1), 'spaceco', 10);

  spaceco.frame = spaceco.damage = 0;

  spaceco.anchor.setTo(0.5, 0.65);
  
  spaceco.scale.setTo(0.25, 0.25);

  Game.entities.spaceco.resourceBay = {};
  
  return spaceco;
};

Game.entities.spaceco.offer = function(){
  Game.spacecoOffered = true;
  
  Game.infoLine.setText(' [up] to enter Spaceco ');
};

Game.entities.spaceco.revoke = function(){
  Game.spacecoOffered = false;

  if(Game.entities.spaceco.getOut_TO){
    clearTimeout(Game.entities.spaceco.getOut_TO);
    Game.entities.spaceco.getOut_TO = null;
  }

  Game.hud.interfaceText.setText('');
  Game.infoLine.setText('');

  Game.entities.hud.close();
};

Game.entities.spaceco.setInterfaceText = function(text){
  Game.hud.interfaceText.setText(Game.entities.spaceco.headingText + text);
};

Game.entities.spaceco.welcome = function(cb){
  Game.entities.spaceco.setInterfaceText('\n\n Welcome to Spaceco, we love you');

  setTimeout(cb, 1500);
};

Game.entities.spaceco.boot = function(cb){
  Game.entities.spaceco.setInterfaceText('\n        Im sorry, but...\n      if you have no money\n    we simply cant help you.');

  setTimeout(Game.entities.spaceco.revoke, 3*1000);
};

Game.entities.spaceco.getValue = function(name){
  var value;
  
  if(name.startsWith('ground')){
    var baseGroundPrice = Game.modes[Game.mode].baseGroundPrice;
    
    value = baseGroundPrice + (((Game.modes[Game.mode].digTime[name.replace('ground_', '')] / 2) - (Game.entities.spaceco.resourceBay[name] || 0)) / 1000)
  }
  else if(name.startsWith('mineral')){
    value = Game.modes[Game.mode].mineralValues[name.replace('mineral_', '')] - ((Game.entities.spaceco.resourceBay[name] || 0) / 40);
  }

  return value;
};

Game.entities.spaceco.open = function(){
  Game.entities.hud.open('spaceco');
  
  Game.infoLine.setText('');

  Game.entities.spaceco.welcome(function(){
    Game.entities.spaceco.setInterfaceText('   Rates  Fuel  Shop     Exit\n');
    Game.entities.spaceco.updateBottomLine();
    
    if(Game.mode === 'normal'){
      delete Game.hull.space;
  
      var mineralNames = Object.keys(Game.hull);
  
      for(var x = 0; x < mineralNames.length; x++){
        Game.entities.spaceco.resourceBay[mineralNames[x]] = Game.entities.spaceco.resourceBay[mineralNames[x]] || 0;
        Game.entities.spaceco.resourceBay[mineralNames[x]] += Game.hull[mineralNames[x]];
  
        Game.credits += Game.hull[mineralNames[x]] * Game.entities.spaceco.getValue(mineralNames[x]);
      }
  
      Game.hull = {};
      Game.hull.space = 10 * ((Game.drill.upgrade || 0) + 1);
  
      if(Game.credits === 0){
        Game.entities.spaceco.getOut_TO = setTimeout(Game.entities.spaceco.boot, 30*1000);
      }
    }
  });
};

Game.entities.spaceco.setView = function(view){
  if(Game.hud.isOpen !== 'spaceco') return;

  if(Game.hud.justSetView) return;
  Game.hud.justSetView = true;
  Game.hud.justSetView_TO = setTimeout(function(){ Game.hud.justSetView = false; }, 400);
  
  Game.spacecoView = view;

  Game.entities.spaceco.updateBottomLine();

  var menu = '';
  var items = '';
  var shortestLength = 10;
  var space = 19;
  
  if(view === 'rates'){
    menu = '  [ pg1 ] Fuel  Shop     Exit\n';
  
    var mineralNames = ['ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue'];
    
    for(var x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + Game.entities.spaceco.getValue(mineralNames[x]).toFixed(2) +'\n';
    }
  }
  else if(view === 'rates_pg2'){
    menu = '  [ pg2 ] Fuel  Shop     Exit\n';

    var mineralNames = ['ground_purple', 'ground_pink', 'ground_black', 'mineral_green', 'mineral_blue', 'mineral_red'];
    
    for(var x = 0; x < mineralNames.length; x++){
      items += mineralNames[x] + (' '.repeat(mineralNames[x].length > shortestLength ? space - (mineralNames[x].length - shortestLength) : space)) + Game.entities.spaceco.getValue(mineralNames[x]).toFixed(2) +'\n';
    }
  }
  else if(view === 'fuel'){
    menu = '   Rates [Fuel] Shop     Exit\n';
    items = 'Gas                            $1\nEnergy                         $2\nSuper Oxygen Liquid Nitrogen   $3';
  }
  else if(view === 'shop'){
    menu = '   Rates  Fuel [ p1 ]    Exit\n';
    items = 'Teleporter                     $5\nResponder Teleporter          $10\nRepair                         $4\nUpgrade                       $10\nTransport                    $100';
  }
  else if(view === 'shop_p2'){
    menu = '   Rates  Fuel [ p2 ]    Exit\n';
    items = 'Timed Charge                   $5\nRemote Charge                 $10\nTimed Freeze Charge           $10\nRemote Freeze Charge          $15';
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

  var purchase;

  if(pointer.y > 70 && pointer.y < 110){// menu
    if(pointer.x > 70 && pointer.x < 165){
      if(Game.spacecoView === 'rates') Game.entities.spaceco.setView('rates_pg2');
      else Game.entities.spaceco.setView('rates');
    }
    else if(pointer.x > 175 && pointer.x < 255){
      Game.entities.spaceco.setView('fuel');
    }
    else if(pointer.x > 265 && pointer.x < 350){
      if(Game.spacecoView === 'shop') Game.entities.spaceco.setView('shop_p2');
      else Game.entities.spaceco.setView('shop');
    }
    else if(pointer.x > 400 && pointer.x < 500){
      Game.entities.spaceco.revoke();
    }
  }

  if(Game.hud.justSelectedItem) return;
  Game.hud.justSelectedItem = true;
  Game.hud.justSelectedItem_TO = setTimeout(function(){ Game.hud.justSelectedItem = false; }, 400);

  if(pointer.y > 120 && pointer.y < 150){
    if(Game.spacecoView === 'fuel'){
      console.log('gas');

      var gasPrice = 1;
      var fuelValue = 1;

      if(Game.credits < gasPrice) return;

      Game.fuel += fuelValue;
      Game.credits -= gasPrice;
    }
    else if(Game.spacecoView === 'shop'){
      console.log('teleporter');

      var teleporterPrice = 5;

      if(Game.credits < teleporterPrice) return;

      Game.credits -= teleporterPrice;

      Game.inventory.teleporter = Game.inventory.teleporter || 0;
      Game.inventory.teleporter++;
    }
    else if(Game.spacecoView === 'shop_p2'){
      console.log('timed charge');

      var explosivePrice = 5;

      if(Game.credits < explosivePrice) return;

      Game.credits -= explosivePrice;
      
      Game.inventory.timed_charge = Game.inventory.timed_charge || 0;
      Game.inventory.timed_charge++;
    }
  }

  else if(pointer.y > 160 && pointer.y < 200){
    if(Game.spacecoView === 'fuel'){
      console.log('energy');

      var energyPrice = 2;
      var fuelValue = 2;      
      
      if(Game.credits < energyPrice) return;

      Game.fuel += fuelValue;
      Game.credits -= energyPrice;
    }
    else if(Game.spacecoView === 'shop'){
      console.log('responder teleporter');

      var teleporterPrice = 10;

      if(Game.credits < teleporterPrice) return;

      Game.credits -= teleporterPrice;

      Game.inventory.responder_teleporter = Game.inventory.responder_teleporter || 0;
      Game.inventory.responder_teleporter++;
    }
    else if(Game.spacecoView === 'shop_p2'){
      console.log('remote charge');

      var explosivePrice = 10;

      if(Game.credits < explosivePrice) return;

      Game.credits -= explosivePrice;

      Game.inventory.remote_charge = Game.inventory.remote_charge || 0;
      Game.inventory.remote_charge++;
    }
  }
  else if(pointer.y > 210 && pointer.y < 240){
    if(Game.spacecoView === 'fuel'){
      console.log('super oxygen liquid nitrogen');

      var solnPrice = 3;
      var fuelValue = 3;      
      
      if(Game.credits < solnPrice) return;

      Game.fuel += fuelValue;
      Game.credits -= solnPrice;
    }
    else if(Game.spacecoView === 'shop'){
      console.log('repair');
    }
    else if(Game.spacecoView === 'shop_p2'){
      console.log('timed freeze charge');

      var explosivePrice = 10;

      if(Game.credits < explosivePrice) return;

      Game.credits -= explosivePrice;

      Game.inventory.timed_freeze_charge = Game.inventory.timed_freeze_charge || 0;
      Game.inventory.timed_freeze_charge++;
    }
  }

  else if(pointer.y > 250 && pointer.y < 280){
    if(Game.spacecoView === 'shop'){
      console.log('upgrade');
    }
    else if(Game.spacecoView === 'shop_p2'){
      console.log('remote freeze charge');

      var explosivePrice = 15;

      if(Game.credits < explosivePrice) return;

      Game.credits -= explosivePrice;
      
      Game.inventory.remote_freeze_charge = Game.inventory.remote_freeze_charge || 0;
      Game.inventory.remote_freeze_charge++;
    }
  }

  else if(pointer.y > 290 && pointer.y < 320){
    if(Game.spacecoView === 'shop'){
      console.log('transport');
    }
  }
  
  if(purchase){
    //idea::todo animate a sprite of the purchased thing going from the top to the bottom (from spaceco to the player)
  }

  Game.entities.spaceco.updateBottomLine();  
};

Game.entities.spaceco.selectItem = function(item){
  if(!item) return;

  var prices = {
    teleporter: 1,
    responder_teleporter: 1,
    repair: 1,
    upgrade: 10,
    transport: 100,
    timed_charge: 1,
    remote_charge: 1,
    timed_freeze_charge: 1,
    remote_freeze_charge: 1,
  };

  if(Game.credits  < prices[item]) return;

  Game.credits -= prices[item];

  if(item === 'transport'){
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
    //todo repair
  }
  else{
    
  }
};

Game.entities.spaceco.hurt = function(ammount){
  ammount = ammount ? parseInt(ammount) : 1;

  Game.spaceco.damage += ammount;
  
  if(Game.spaceco.damage === 10) setTimeout(Game.spaceco.kill, 400);
  else Game.spaceco.frame = Game.spaceco.damage;
};