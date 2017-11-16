var Worlds = {
  categories: {
    easy: [
      {
        briefing: '\n\n Welcome to asteroid TR982-420',
        size: {
          width: [50, 60],
          depth: [210, 320]
        },
        holeChance: 0.1,
        lavaChance: 0.4,
        gasChance: 0.4,
        monsterChance: 0.4,
        mineralChance: 0.042,
        mineralRareity: {
          green: 30,
          blue: 30,
          purple: 30,
          teal: 8,
          '???': 2
        },
        layers: [
          { blue: 40, purple: 60 },
          { blue: 40, red: 60 },
          { green: 50, white: 50 },
          { pink: 34, black: 32, green: 32 },
          { blue: 40, purple: 60 }
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid AE02A-809',
        size: {
          width: [32, 45],
          depth: [200, 340]
        },
        holeChance: 0.2,
        lavaChance: 0.2,
        gasChance: 0.2,
        monsterChance: 0.2,
        mineralChance: 0.05,
        mineralRareity: {
          red: 65,
          blue: 23,
          teal: 10,
          '???': 2
        },
        layers: [
          { blue: 75, pink: 10, teal: 10, purple: 5 },
          { blue: 60, pink: 10, teal: 15, purple: 15 },
          { blue: 40, pink: 25, teal: 15, purple: 20 },
          { blue: 20, pink: 15, teal: 25, purple: 40 },
          { blue: 5, pink: 45, teal: 5, purple: 45 },
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid ZPQ6D-N02',
        size: {
          width: [45, 60],
          depth: [200, 300]
        },
        holeChance: 0.2,
        lavaChance: 0.4,
        gasChance: 0.4,
        monsterChance: 0.2,
        mineralChance: 0.07,
        mineralRareity: {
          blue: 45,
          purple: 30,
          teal: 20,
          '???': 5
        },
        layers: [
          { blue: 70, yellow: 15, orange: 10, black: 5 },
          { blue: 60, yellow: 20, orange: 10, black: 10 },
          { blue: 40, yellow: 10, orange: 30, black: 20 },
          { blue: 50, yellow: 15, orange: 20, black: 15 },
          { blue: 30, yellow: 5, orange: 60, black: 5 },
          { blue: 14, yellow: 25, orange: 60, black: 1 },
          { blue: 1, orange: 97, black: 1 }
        ]
      },
      {
        briefing: '\n\n   Welcome to moon D83R-W110',
        size: {
          width: [40, 50],
          depth: [250, 400]
        },
        holeChance: 0.1,
        lavaChance: 0.1,
        gasChance: 0.1,
        monsterChance: 0.3,
        mineralChance: 0.1,
        mineralRareity: {
          green: 72,
          red: 5,
          blue: 20,
          purple: 1,
          teal: 1,
          '???': 1
        },
        layers: [
          { white: 60, orange: 10, yellow: 10, teal: 10, black: 10 },
          { white: 50, orange: 20, yellow: 10, teal: 10, black: 10 },
          { white: 50, orange: 10, yellow: 10, teal: 15, black: 15 },
          { white: 20, orange: 10, yellow: 10, teal: 30, black: 30 },
          { white: 60, orange: 10, yellow: 10, teal: 10, black: 10 },
          { white: 80, orange: 5, yellow: 5, teal: 5, black: 5 },
        ]
      },
    ],
    normal: [
      {
        briefing: '\n\n Welcome to asteroid GH734-1B2',
        size: {
          width: [30, 40],
          depth: [300, 425]
        },
        holeChance: 0.12,
        lavaChance: 0.3,
        gasChance: 0.3,
        monsterChance: 0.6,
        mineralChance: 0.15,
        mineralRareity: {
          red: 50,
          purple: 35,
          '???': 15,
        },
        layers: [
          { teal: 5, red: 20, purple: 37.5, pink: 37.5 },
          { white: 35, red: 15, purple: 25, pink: 25 },
          { white: 25, red: 15, purple: 30, pink: 30 },
          { white: 15, red: 20, purple: 35, pink: 30 },
          { white: 5, red: 30, purple: 30, pink: 35 },
          { white: 10, red: 20, purple: 25, pink: 35, teal: 10 },
          { red: 20, purple: 25, pink: 25, teal: 30 },
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid SP425-13K',
        size: {
          width: [40, 50],
          depth: [300, 425]
        },
        holeChance: 0.12,
        lavaChance: 0.3,
        gasChance: 0.3,
        monsterChance: 0.6,
        mineralChance: 0.15,
        mineralRareity: {
          red: 50,
          purple: 35,
          '???': 15,
        },
        layers: [
          { teal: 5, red: 20, purple: 37.5, pink: 37.5 },
          { white: 35, red: 15, purple: 25, pink: 25 },
          { white: 25, red: 15, purple: 30, pink: 30 },
          { white: 15, red: 20, purple: 35, pink: 30 },
          { white: 5, red: 30, purple: 30, pink: 35 },
          { white: 10, red: 20, purple: 25, pink: 35, teal: 10 },
          { red: 20, purple: 25, pink: 25, teal: 30 },
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid FR153-34R',
        size: {
          width: [40, 60],
          depth: [200, 360]
        },
        holeChance: 0.3,
        lavaChance: 0.6,
        gasChance: 0.001,
        monsterChance: 0.1,
        mineralChance: 0.15,
        mineralRareity: {
          red: 99,
          '???': 1
        },
        layers: [
          { white: 65, orange: 25, yellow: 5, red: 5 },
          { white: 50, orange: 30, yellow: 10, red: 10 },
          { white: 40, orange: 35, yellow: 15, red: 5 },
          { white: 30, orange: 40, yellow: 20, red: 10 },
          { white: 20, orange: 40, yellow: 30, red: 10 },
          { white: 10, orange: 35, yellow: 35, red: 20 },
          { white: 5, orange: 30, yellow: 45, red: 20 },
          { white: 5, orange: 20, yellow: 45, red: 30 },
          { white: 5, orange: 10, yellow: 35, red: 50 },
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid ML876-L01',
        size: {
          width: [40, 60],
          depth: [180, 300]
        },
        holeChance: 0.15,
        lavaChance: 0.6,
        gasChance: 0.2,
        monsterChance: 0.8,
        mineralChance: 0.05,
        mineralRareity: {
          red: 84,
          blue: 5,
          purple: 5,
          teal: 5,
          '???': 1
        },
        layers: [
          { white: 60, purple: 30, red: 10 },
          { white: 60, purple: 20, red: 20 },
          { white: 50, purple: 20, red: 30 },
          { white: 30, purple: 20, red: 30, black: 15, teal: 5 },
          { white: 20, red: 20, black: 30, teal: 30 },
          { white: 20, red: 30, black: 20, teal: 20, blue: 10 },
          { white: 10, red: 20, black: 10, teal: 30, blue: 30 }
        ]
      },
      {
        briefing: '\n\nWelcome to metoerite AE02A-809',
        size: {
          width: [32, 60],
          depth: [220, 400]
        },
        holeChance: 0.05,
        lavaChance: 0.5,
        gasChance: 0.5,
        monsterChance: 0.6,
        mineralChance: 0.08,
        mineralRareity: {
          green: 39,
          blue: 30,
          teal: 30,
          '???': 1
        },
        layers: [
          { yellow: 80, green: 10, teal: 5, red: 5 },
          { yellow: 75, green: 10, teal: 10, red: 5 },
          { yellow: 30, green: 30, teal: 30, red: 10 },
          { yellow: 30, green: 30, orange: 10, teal: 10, red: 20 },
          { yellow: 35, green: 40, orange: 20, teal: 5 },
          { yellow: 10, green: 30, orange: 50, white: 10 },
          { yellow: 5, green: 25, orange: 60, white: 10 },
          { green: 10, orange: 50, white: 40 },
          { orange: 20, white: 60, black: 20 },
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid ZT542-21N',
        size: {
          width: [30, 50],
          depth: [200, 350]
        },
        holeChance: 0.5,
        lavaChance: 0.6,
        gasChance: 0.6,
        monsterChance: 0.6,
        mineralChance: 0.1,
        mineralRareity: {
          green: 20,
          red: 30,
          blue: 30,
          purple: 10,
          teal: 9,
          '???': 1
        },
        layers: [
          { white: 70, yellow: 15, black: 5 },
          { white: 60, yellow: 20, blue: 10 },
          { white: 40, yellow: 30, black: 30 },
          { white: 20, yellow: 40, blue: 40 },
          { white: 5, orange: 55, black: 40 },
          { green: 20, orange: 40, blue: 40 },
          { green: 20, orange: 30, red: 50 },
          { green: 30, orange: 30, red: 40 }
        ]
      },
      {
        briefing: '\n\n   Welcome to moon CM12W-I13',
        size: {
          width: [30, 50],
          depth: [160, 300]
        },
        holeChance: 0.12,
        lavaChance: 0.25,
        gasChance: 0.25,
        monsterChance: 0.18,
        mineralChance: 0.1,
        mineralRareity: {
          green: 10,
          red: 30,
          blue: 15,
          purple: 15,
          teal: 25,
          '???': 5
        },
        layers: [
          { teal: 50, white: 20, green: 30 },
          { teal: 50, white: 5, green: 35, pink: 10 },
          { teal: 40, green: 35, pink: 15, purple: 5 },
          { teal: 30, green: 25, pink: 15, purple: 30 },
          { teal: 30, green: 40, blue: 30 }
        ]
      }
    ],
    hard: [
      {
        briefing: '\n\n Welcome to asteroid CR417-13F',
        size: {
          width: [55, 90],
          depth: [300, 400]
        },
        holeChance: 0.1,
        lavaChance: 0.7,
        gasChance: 0.01,
        monsterChance: 0.2,
        mineralChance: 0.15,
        mineralRareity: {
          blue: 40,
          purple: 30,
          teal: 20,
          '???': 10,
        },
        layers: [
          { black: 65, red: 25, purple: 5, pink: 5 },
          { black: 50, red: 30, purple: 10, pink: 10 },
          { black: 40, red: 35, purple: 15, pink: 5 },
          { black: 30, red: 40, purple: 20, pink: 10 },
          { black: 20, red: 40, purple: 30, pink: 10 },
          { black: 10, red: 35, purple: 35, pink: 20 },
          { black: 5, red: 30, purple: 45, pink: 20 },
          { black: 5, red: 20, purple: 45, pink: 30 },
          { black: 5, red: 10, purple: 35, pink: 50 },
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid GS340-20S',
        size: {
          width: [50, 80],
          depth: [200, 400]
        },
        holeChance: 0.2,
        lavaChance: 0.01,
        gasChance: 0.6,
        monsterChance: 0.01,
        mineralChance: 0.05,
        mineralRareity: {
          green: 80,
          blue: 5,
          purple: 4,
          '???': 1
        },
        layers: [
          { green: 60, purple: 30, orange: 10 },
          { green: 60, purple: 20, orange: 20 },
          { green: 50, purple: 20, orange: 30 },
          { green: 30, purple: 20, orange: 30, black: 15, yellow: 5 },
          { green: 20, orange: 20, black: 30, yellow: 30 },
          { green: 20, orange: 30, black: 20, yellow: 20, blue: 10 },
          { green: 10, orange: 20, black: 10, yellow: 30, blue: 30 }
        ]
      },
      {
        briefing: '\n\n Welcome to asteroid ZT546-3T1',
        size: {
          width: [40, 70],
          depth: [200, 350]
        },
        holeChance: 0.5,
        lavaChance: 0.6,
        gasChance: 0.6,
        monsterChance: 0.6,
        mineralChance: 0.1,
        mineralRareity: {
          green: 20,
          red: 30,
          blue: 30,
          purple: 10,
          teal: 9,
          '???': 1
        },
        layers: [
          { white: 70, red: 15, black: 5 },
          { white: 60, red: 20, black: 10 },
          { white: 40, red: 30, black: 30 },
          { white: 20, red: 40, black: 40 },
          { white: 5, red: 55, black: 40 },
          { green: 20, red: 40, black: 40 },
          { green: 20, red: 30, black: 50 },
          { green: 30, red: 30, black: 40 }
        ]
      },
      {
        briefing: '\n\nWelcome to metoerite SP43N-72D',
        size: {
          width: [64, 90],
          depth: [220, 400]
        },
        holeChance: 0.02,
        lavaChance: 0.6,
        gasChance: 0.6,
        monsterChance: 0.8,
        mineralChance: 0.15,
        mineralRareity: {
          red: 80,
          blue: 3,
          purple: 2,
          '???': 15
        },
        layers: [
          { red: 75, yellow: 20, black: 5 },
          { red: 50, yellow: 40, black: 10 },
          { red: 40, yellow: 50, purple: 10 },
          { red: 30, yellow: 40, purple: 30 },
          { red: 20, yellow: 30, purple: 50 },
          { red: 10, yellow: 20, purple: 70 },
          { yellow: 10, purple: 80, orange: 10 },
          { purple: 65, orange: 30, black: 5 },
          { purple: 45, orange: 45, black: 10 },
          { purple: 40, orange: 70, teal: 10 },
          { purple: 30, orange: 50, teal: 20 },
          { purple: 20, orange: 40, teal: 40 },
          { purple: 10, orange: 20, teal: 70 },
          { teal: 100 }
        ]
      }
    ]
  }
};

module.exports = Worlds;