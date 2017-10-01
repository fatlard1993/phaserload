/* global Phaser, Game */

Game.entities.spaceco = function(game){};

Game.entities.spaceco.spacecoGreeting = ' Welcome to Spaceco, we love you ';
Game.entities.spaceco.spacecoRates = '\n    We basically just rob you,\n              but...\n    We do give you some fuel!';
Game.entities.spaceco.spacecoFuel = '\nGas : $1\nSuper Oxygen Liquid Nitrogen : $2\nEnergy Charge : $1';
Game.entities.spaceco.spacecoProducts = '\nTeleporter : $2\nRepair : $4\nUpgrade : $10';

Game.entities.spaceco.create = function(game, x, y){
  var spaceco = game.add.sprite(x, y, 'spaceco', 10);

  spaceco.frame = spaceco.damage = 0;

  spaceco.anchor.setTo(0.5, 0.65);
  
  spaceco.scale.setTo(0.25, 0.25);
  
  return spaceco;
};

Game.entities.spaceco.offer = function(){
  Game.spacecoOffered = true;
  
  Game.infoLine.setText(' [up] to enter Spaceco ');
};

Game.entities.spaceco.revoke = function(){
  Game.spacecoOffered = false;
  
  Game.hud.interfaceText.setText(' Good bye!');    

  Game.entities.hud.close();

  Game.inSpaceco = false;

  setTimeout(function(){
    Game.hud.interfaceText.setText('');
  }, 800);
};

Game.entities.spaceco.open = function(){
  Game.entities.hud.open();

  Game.inSpaceco = true;
  
  Game.infoLine.setText('');

  Game.entities.spaceco.setView('rates');

  if(Game.config.mode === 'normal'){
    delete Game.hull.space;

    var mineralNames = Object.keys(Game.hull);

    for(var x = 0; x < mineralNames.length; x++){
      if(mineralNames[x].startsWith('ground')) Game.credits += Game.hull[mineralNames[x]] * Game.config.groundDistribution[Game.config.mode][mineralNames[x].replace('ground_', '')]
      else if(mineralNames[x].startsWith('mineral')){
        Game.credits += Game.hull[mineralNames[x]] * Game.config.spacecoMineralPrices[Game.config.mode][mineralNames[x].replace('mineral_', '')];
      }
    }

    Game.hull = {};
    Game.hull.space = 10;

    Game.fuel += Game.credits;
    Game.credits = 0;

    Game.entities.hud.update();
  }
};

Game.entities.spaceco.setView = function(view){
  Game.spacecoView = view;
  
  if(view === 'rates'){
    Game.hud.interfaceText.setText(Game.entities.spaceco.spacecoGreeting + '\n  {Rates} | Fuel | Shop | Exit\n' + Game.entities.spaceco.spacecoRates);
  }
  else if(view === 'fuel'){
    Game.hud.interfaceText.setText(Game.entities.spaceco.spacecoGreeting + '\n  Rates | {Fuel} | Shop | Exit\n' + Game.entities.spaceco.spacecoFuel);
  }
  else if(view === 'shop'){
    Game.hud.interfaceText.setText(Game.entities.spaceco.spacecoGreeting + '\n  Rates | Fuel | {Shop} | Exit\n' + Game.entities.spaceco.spacecoProducts);
  }
};