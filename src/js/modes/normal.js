/* global Phaser, Game */

Game.modes.normal = {
  baseDrillMoveTime: 300,
  hudLayout: {
    position: 'GPS',
    credits: '$',
    fuel: 'Fuel',
    hull: 'Hull'
  },
  mineralValues: {
    green: 3,
    red: 4.5,
    blue: 8
  },
  baseGroundPrice: 0.18,
  blockBehavior: {
    red: 'lava:~:35'
  },
  digTime: {
    white: 400,
    orange: 500,
    yellow: 540,
    green: 580,
    teal: 640,
    blue: 700,
    purple: 730,
    pink: 750,
    red: 300,
    black: 800
  },
  level: -1,
  nextLevel: function(inc){
    if(inc){
      Game.modes[Game.mode].level++;
      if(Game.modes[Game.mode].level >= Game.modes[Game.mode].levels.length) Game.modes[Game.mode].level = 0;  
    }
    else{
      Game.modes[Game.mode].level = Game.rand(0, Game.modes[Game.mode].levels.length - 1);
    }
  },
  levels: [
    {
      missionText: '\n\n Welcome to asteroid TR982-420'+ Game.rand(100, 999),
      size: {
        width: [50, 70],
        depth: [100, 200]
      },
      groundChance: 0.1,
      lavaChance: 0.4,
      monsterChance: 0.4,
      mineralRareity: {
        green: 50,
        blue: 50
      },
      levels: [
        { blue: 40, purple: 60 },
        { blue: 40, red: 60 },
        { green: 50, white: 50 },
        { pink: 34, black: 32, green: 32 },
        { blue: 40, purple: 60 }
      ]
    },
    {
      missionText: '\n\n Welcome to asteroid AE02A-809'+ Game.rand(100, 999),
      size: {
        width: [32, 45],
        depth: [100, 200]
      },
      groundChance: 0.2,
      lavaChance: 0.2,
      monsterChance: 0.2,
      mineralRareity: {
        green: 50,
        red: 35,
        blue: 15
      },
      levels: [
        { white: 50, black: 50 },
        { orange: 50, yellow: 50 },
        { blue: 50, purple: 50 }
      ]
    },
    {
      missionText: '\n\n Welcome to asteroid ZPQ6D-N02'+ Game.rand(100, 999),
      size: {
        width: [45, 60],
        depth: [200, 300]
      },
      groundChance: 0.2,
      lavaChance: 0.4,
      monsterChance: 0.2,
      mineralRareity: {
        green: 35,
        red: 15,
        blue: 50
      },
      levels: [
        { blue: 70, yellow: 15, orange: 10, black: 5 },
        { blue: 60, yellow: 20, orange: 10, black: 10 },
        { blue: 40, yellow: 10, orange: 30, black: 20 },
        { blue: 50, yellow: 15, orange: 20, black: 15 },
        { blue: 30, yellow: 5, orange: 60, black: 5 },
        { blue: 14, yellow: 25, orange: 60, black: 1 },
        { blue: 1, yellow: 1, orange: 97, black: 1 }
      ]
    },
    {
      missionText: '\n\n   Welcome to moon D83R-W110'+ Game.rand(100, 999),
      size: {
        width: [60, 70],
        depth: [250, 400]
      },
      groundChance: 0.1,
      lavaChance: 0.1,
      monsterChance: 0.3,
      mineralRareity: {
        green: 5,
        red: 75,
        blue: 20
      },
      levels: [
        { white: 60, orange: 10, yellow: 10, teal: 10, black: 10 },
        { white: 50, orange: 20, yellow: 10, teal: 10, black: 10 },
        { white: 50, orange: 10, yellow: 10, teal: 15, black: 15 },
        { white: 20, orange: 10, yellow: 10, teal: 30, black: 30 },
        { white: 60, orange: 10, yellow: 10, teal: 10, black: 10 },
        { white: 80, orange: 5, yellow: 5, teal: 5, black: 5 },
      ]
    },
    {
      missionText: '\n\nWelcome to metoerite AE02A-809'+ Game.rand(100, 999),
      size: {
        width: [32, 64],
        depth: [100, 400]
      },
      groundChance: 0.05,
      lavaChance: 0.5,
      monsterChance: 0.6,
      mineralRareity: {
        green: 50,
        blue: 50
      },
      levels: [
        { yellow: 90, green: 10 },
        { yellow: 80, green: 10, teal: 10 },
        { yellow: 70, green: 30 },
        { yellow: 60, green: 30, orange: 10 },
        { yellow: 40, green: 40, orange: 20 },
        { yellow: 10, green: 30, orange: 50, white: 10 },
        { yellow: 5, green: 25, orange: 60, white: 10 },
        { green: 10, orange: 50, white: 40 },
        { orange: 20, white: 60, black: 20 },
      ]
    },
    {
      missionText: '\n\nWelcome to metoerite SP43N-72D'+ Game.rand(100, 999),
      size: {
        width: [32, 64],
        depth: [100, 400]
      },
      groundChance: 0.02,
      lavaChance: 0.6,
      monsterChance: 0.8,
      mineralRareity: {
        red: 99,
        blue: 1
      },
      levels: [
        { red: 80, pink: 20 },
        { red: 60, pink: 40 },
        { red: 50, pink: 50 },
        { red: 40, pink: 50, purple: 10 },
        { red: 30, pink: 40, purple: 30 },
        { red: 20, pink: 30, purple: 50 },
        { red: 10, pink: 20, purple: 70 },
        { pink: 10, purple: 80, blue: 10 },
        { purple: 70, blue: 30 },
        { purple: 50, blue: 50 },
        { purple: 40, blue: 70, black: 10 },
        { purple: 30, blue: 50, black: 20 },
        { purple: 20, blue: 40, black: 40 },
        { purple: 10, blue: 20, black: 70 },
        { black: 100 }
      ]
    }
  ]
};