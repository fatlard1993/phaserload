const Express = require('express'), app = Express();
const HttpServer = require('http').createServer(app);
const BodyParser = require('body-parser');
const CookieParser = require('cookie-parser');

const HTTP_PORT = process.env.NODE_ENV === 'production' ? 80 : 8080;

app.use(Express.static('./public'));

app.get('*', function redirectTrailingWak(req, res, next){
  var queryStringIndex = req.originalUrl.indexOf('?');
  var path = req.originalUrl.slice(0, ((queryStringIndex >= 0) ? queryStringIndex : req.originalUrl.length));

  if(path.slice(-1) !== '/') return next();

  var redirectPath = path.slice(0, (path.length - 1)) + ((queryStringIndex > -1) ? req.originalUrl.slice(queryStringIndex) : '');

  console.log('Redirecting '+ req.originalUrl +' to '+ redirectPath);

  res.redirect(301, redirectPath);
});

app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());
app.use(CookieParser());

app.get('*', function(req, res, next){
  console.log('GET '+ req.path);

  next();
});

app.get('/test', function(req, res, next){
  res.send('test');
});




function rand(min, max, excludes){
  excludes = excludes || [];

  var num = Math.round(Math.random() * (max - min) + min);

  if(excludes.includes(num)) return rand(min, max, excludes);

  return num;
}

function chance(chance){
  if(chance === undefined){ chance = 50; }
  return chance > 0 && (Math.random() * 100 <= chance);
}

function weightedChance(items){
  var sum = 0, rand = Math.random() * 100;

  var itemNames = Object.keys(items);

  for(var x = 0; x < itemNames.length; x++){
    sum += items[itemNames[x]];

    if(rand <= sum) return itemNames[x];
  }
}

var levels = [
  {
    briefing: '\n\n Welcome to asteroid GH734-1B2'+ rand(100, 999),
    size: {
      width: [50, 100],
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
    briefing: '\n\n Welcome to asteroid SP425-13K'+ rand(100, 999),
    size: {
      width: [50, 110],
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
    briefing: '\n\n Welcome to asteroid CR417-13F'+ rand(100, 999),
    size: {
      width: [45, 90],
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
    briefing: '\n\n Welcome to asteroid FR153-34R'+ rand(100, 999),
    size: {
      width: [70, 110],
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
    briefing: '\n\n Welcome to asteroid ZT546-3T1'+ rand(100, 999),
    size: {
      width: [80, 120],
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
    briefing: '\n\n Welcome to asteroid ML876-L01'+ rand(100, 999),
    size: {
      width: [40, 80],
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
    briefing: '\n\n Welcome to asteroid GS340-20S'+ rand(100, 999),
    size: {
      width: [80, 140],
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
    briefing: '\n\n Welcome to asteroid TR982-420'+ rand(100, 999),
    size: {
      width: [50, 70],
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
    briefing: '\n\n Welcome to asteroid AE02A-809'+ rand(100, 999),
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
    briefing: '\n\n Welcome to asteroid ZPQ6D-N02'+ rand(100, 999),
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
      { blue: 1, yellow: 1, orange: 97, black: 1 }
    ]
  },
  {
    briefing: '\n\n   Welcome to moon D83R-W110'+ rand(100, 999),
    size: {
      width: [60, 70],
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
  {
    briefing: '\n\nWelcome to metoerite AE02A-809'+ rand(100, 999),
    size: {
      width: [32, 64],
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
    briefing: '\n\n   Welcome to moon CM12W-I13'+ rand(100, 999),
    size: {
      width: [30, 70],
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
  },
  {
    briefing: '\n\nWelcome to metoerite SP43N-72D'+ rand(100, 999),
    size: {
      width: [32, 64],
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
];

var mapNames = ['monster', 'lava', 'gas', 'player1', 'mineral_green', 'mineral_red', 'mineral_blue', 'mineral_purple', 'mineral_teal', 'mineral_???', 'ground_white', 'ground_orange', 'ground_yellow', 'ground_green', 'ground_teal', 'ground_blue', 'ground_purple', 'ground_pink', 'ground_red', 'ground_black'];

function generateMap(){
  var settings = levels[rand(0, levels.length - 1)];

  var mapData = {
    width: rand(settings.size.width[0], settings.size.width[1]),
    depth: rand(settings.size.depth[0], settings.size.depth[1]),
    map: [],
    viewBufferMap: []
  };

  var mineralRareity = settings.mineralRareity;

  for(var x = 0; x < mapData.width; x++){
    for(var y = 0; y < mapData.depth; y++){
      var holeChance = y * settings.holeChance;
      var mineralChance = y * settings.mineralChance;
      var lavaChance = y * settings.lavaChance;
      var gasChance = y * settings.gasChance;
      var monsterChance = y * settings.monsterChance;

      var groundRareity = settings.layers[Math.ceil(settings.layers.length * (y / mapData.depth)) - 1];

      mapData.map[x] = mapData.map[x] || [];
      mapData.map[x][y] = [-1, -1];

      mapData.viewBufferMap[x] = mapData.viewBufferMap[x] || [];
      mapData.viewBufferMap[x][y] = [-1, -1];

      if(y > 1 && !chance(holeChance)){
        mapData.map[x][y] = [mapNames.indexOf('ground_'+ weightedChance(groundRareity)), -1];

        if(y > 5 && chance(mineralChance)){
          mapData.map[x][y][1] = mapNames.indexOf('mineral_'+ weightedChance(mineralRareity));
        }
      }

      else if(y > 8 && chance(lavaChance)){
        mapData.map[x][y] = [mapNames.indexOf('lava'), -1];
      }

      else if(y > 8 && chance(gasChance)){
        mapData.map[x][y] = [mapNames.indexOf('gas'), -1];
      }

      else if(y > 8 && chance(monsterChance)){
        mapData.map[x][y] = [mapNames.indexOf('monster'), -1];
      }
    }
  }

  return mapData;
}

app.get('/map', function(req, res, next){
  res.json(generateMap());
});





app.use(function(req, res, next){
  next({ detail: `The path ${req.path} does not exist`, status: 404 });
});

app.use(function(err, req, res, next){
  console.error('Error catch!');

  var headers = {
    '401': '401 - Unauthorized',
    '403': '403 - Forbidden',
    '404': '404 - Not Found',
    '500': '500 - Internal Server Error'
  };

  if(!err.status){
    console.error('No Error Status Provided!');

    if(err instanceof Object) err.status = 500;
    else err = { err: err, status: 500 };
  }

  console.error(err);

  var detail = err.detail || JSON.stringify(err) || 'Unknown error!';

  res.status(err.status)[req.headers.accept && req.headers.accept === 'application/json' ? 'json' : 'send'](detail);
});

HttpServer.listen(HTTP_PORT, function(){
  console.log('HTTP server is running!');
});