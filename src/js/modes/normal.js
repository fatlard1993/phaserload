/* global Phaser, Game */

Game.modes.normal = {
  baseDrillMoveTime: 300,
  hudLayout: {
    position: '*',
    credits: '$',
    fuel: 'Fuel',
    hull: 'Hull'
  },
  mineralValues: {
    green: 3,
    red: 4.5,
    blue: 8
  },
  blockBehavior: {
    red: 'lava:~:35'
  },
  digTime: {
    white: 400,
    orange: 450,
    yellow: 480,
    green: 500,
    teal: 620,
    blue: 560,
    purple: 580,
    pink: 600,
    red: 350,
    black: 1100
  },
  level: 2,
  levels: [
    {
      size: {
        width: [13, 16],
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
      size: {
        width: [24, 32],
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
        { blue: 50, black: 50 },
        { blue: 40, red: 60 },
        { blue: 30, yellow: 70 }
      ]
    },
    {
      size: {
        width: [45, 52],
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
        { red: 90, black: 10 },
        { white: 90, orange: 10 },
        { orange: 90, yellow: 10 },
        { yellow: 90, green: 10 },
        { green: 90, teal: 10 },
        { teal: 90, blue: 10 },
        { blue: 90, purple: 10 },
        { purple: 90, pink: 10 },
        { pink: 90, red: 10 },
      ]
    }
  ]
};