/* global Phaser */

var Game = {
  config: {
    backgroundColor: '#333',
    textColor: '#227660',
    font: 'monospace',

    hudTextColor: '#94B133',

    width: 832,
    height: 448,
  
    blockSize: 64,
    blockMiddle: 64 * 3.5,
  
    drillMoveTime: {
      safe: 300,
      normal: 300,
      chaos: 100
    },

    mode: 'normal',

    groundDistribution: {
      safe: { ground: 0.7, ground_blue: 0.1, ground_green: 0.2 },
      normal: { ground: 0.7, ground_blue: 0.01, ground_green: 0.12, ground_purple: 0.01, ground_teal: 0.01, ground_red: 0.15 },
      chaos: { ground: 0.2, ground_blue: 0.16, ground_green: 0.16, ground_purple: 0.16, ground_teal: 0.16, ground_red: 0.16 }
    },

    digTime: {
      safe: {
        ground: 300,
        ground_green: 300,
        ground_blue: 300
      },
      normal: {
        ground_red: 450,
        ground: 500,
        ground_green: 620,
        ground_blue: 700,
        ground_teal: 820,
        ground_purple: 960
      },
      chaos: {
        ground_red: 100,
        ground: 100,
        ground_green: 100,
        ground_blue: 100,
        ground_teal: 100,
        ground_purple: 100
      }
    },

    blockBehavior: {
      normal: {
        ground_red: 'lava:~:40',
        ground_teal: 'lavaSolidify',
        ground_purple: 'save:~:90,lavaRelease'
      }
    },

    hudContents: {
      safe: {
        depth: 'depth',
        blue: 'score:~:blue',
        green: 'score:~:green'
      },
      normal: {
        depth: 'depth',
        fuel: 'fuel',
        diamonds: 'score:~:blue'
      },
      chaos: {
        depth: 'depth',
        blue: 'score:~:blue',
        green: 'score:~:green',
        teal: 'score:~:teal',
        purple: 'score:~:purple'
      }
    },

    holeChance: {
      safe: 0,
      get normal(){
        return Game.depth * 0.1;
      },
      get chaos(){
        return Game.depth * 0.5;
      }
    },

    lavaChance: {
      safe: 0,
      get normal(){
        return Game.depth * 0.1;
      },
      get chaos(){
        return Game.depth * 0.5;
      }
    },

    monsterChance: {
      safe: 0,
      get normal(){
        return Game.depth * 0.1;
      },
      get chaos(){
        return Game.depth * 0.5;
      }
    },
  
    monsterWakeupDelay: 600,
    monsterStepDelay: 300,
    monsterMoveSpeed: 400
  },
  states: {},
  entities: {},
  chance: function(chance){
    if(chance === undefined){ chance = 50; }
    return chance > 0 && (Math.random() * 100 <= chance);
  },
  weightedChance: function(spec){
    var i, sum = 0, rand = Math.random();
    
    for(i in spec){
      sum += spec[i];

      if(rand <= sum) return i;
    }
  },
  setupStage: function(){
    Game.game.stage.backgroundColor = Game.config.backgroundColor;
  
    Game.game.world.setBounds(0, 0, Game.game.width, 1000 * Game.config.blockSize);
  },
  addRectangle: function(color, width, height){
    var rect = Game.game.add.graphics(0, 0);
    rect.beginFill(color, 1);
    rect.drawRect(0, 0, width || Game.game.width, height || Game.game.height);
    rect.endFill();

    return rect;
  },
  fadeIn: function(length, color, delay){
    if(delay === undefined) delay = 0;
    if(color === undefined) color = 0x000000;
    if(length === undefined) length = 500;

    var curtain = Game.addRectangle(color);
    curtain.alpha = 1;
    Game.game.add.tween(curtain).to({ alpha: 0 }, length, Phaser.Easing.Quadratic.In, true, delay);
  },
  fadeOut: function(length, color, delay){
    if(delay === undefined) delay = 0;
    if(color === undefined) color = 0x000000;
    if(length === undefined) length = 500;

    var curtain = Game.addRectangle(color);
    curtain.alpha = 0;
    Game.game.add.tween(curtain).to({ alpha: 1 }, length, Phaser.Easing.Quadratic.In, true, delay);
  },
  normalizePosition: function(x, y){
    x = Math.floor(x / (Game.config.blockSize / 2)) * (Game.config.blockSize / 2);
    y = Math.floor(y / (Game.config.blockSize / 2)) * (Game.config.blockSize / 2);

    return { x: x, y: y };
  },
  groundAt: function(x, y){
    var position = Game.normalizePosition(x, y);

    return (!Game.groundMap[position.x] ? 0 : (!Game.groundMap[position.x][position.y] ? 0 : Game.groundMap[position.x][position.y]));
  },
  updateHud: function(){
    var hudItemLabels = Object.keys(Game.config.hudContents[Game.config.mode]);
    for(var x = 0; x < Game.hudItemCount; x++){
      var label = hudItemLabels[x];
      var value = Game.config.hudContents[Game.config.mode][hudItemLabels[x]].split(':~:');
      var text = label +': ';
      
      if(value[0] === 'depth') text += Game.depth;
      else if(value[0] === 'fuel') text += Game.greenScore.toFixed(1);
      else{
        if(value[0] === 'score' && Game[value[1] +'Score']) text += Game[value[1] +'Score'];
      }

      console.log('setting: ', 'hudLine'+ (x + 1), ' to: ', text);
  
      Game['hudLine'+ (x + 1)].setText(text);
    }
  }
};

window.onload = function(){
  document.getElementById('game').style.marginTop = (document.body.clientHeight - Game.config.height) / 2 +'px';

  Game.config.width = Math.max(10, Math.floor(document.body.clientWidth / 64)) * 64;
  
  var game = Game.game = new Phaser.Game(Game.config.width, Game.config.height, Phaser.AUTO, 'game');

  console.log('onload');
  
  game.state.add('boot', Game.states.boot);
  game.state.add('load', Game.states.load);
  game.state.add('lobby', Game.states.lobby);
  game.state.add('game', Game.states.game);
  game.state.add('end', Game.states.end);

  console.log('states added');

  game.state.start('boot');  
};
