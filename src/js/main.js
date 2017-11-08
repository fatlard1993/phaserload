/* global Phaser, screenfull, io, Dom, Log, Game */

var Socket;

document.oncontextmenu = function(evt) { evt.preventDefault(); };

window.onload = function(){
  console.log('onload');

  Socket = io.connect(window.location.protocol +'//'+ window.location.hostname, { secure: true });

  Socket.emit('connect_request', {
    username: Dom.cookie.get('username') || 'test_' + Game.rand(1, 99)
  });

  Socket.on('welcome', function(data){
    console.log('rooms', data);

    if(data.rooms.length) Socket.emit('join_room', data.rooms[0]);
    else Socket.emit('create_room', {
      name: 'test_room_' + Game.rand(1, 99),
      playerCount: 10
    });

    Socket.on('roomData', function(data){
      console.log('roomData', data);

      Game = Object.assign(Game, data.mapData);
    });
  });

  let clientHeight = document.body.clientHeight;
  let clientWidth = document.body.clientWidth;
  let minViewWidth = 10 * Game.blockPx;
  let minViewHeight = 8 * Game.blockPx;
  let scale = (clientWidth < minViewWidth ? minViewWidth / clientWidth : 1);

  if(clientHeight - minViewHeight < clientWidth - minViewWidth) scale = (clientHeight < minViewHeight ? minViewHeight / clientHeight : 1);

  Game.viewWidth = Math.max(minViewWidth, clientWidth * scale);
  Game.viewHeight = clientHeight * scale;

  Game.game = new Phaser.Game(Game.viewWidth, Game.viewHeight, null, 'game');

  Game.game.state.add('load', Game.states.load);
  Game.game.state.add('lobby', Game.states.lobby);
  Game.game.state.add('play', Game.states.play);
  Game.game.state.add('end', Game.states.end);

  console.log('states added');

  setTimeout(function(){
    if(scale !== 1){
      Game.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      Game.game.scale.pageAlignHorizontally = true;
      Game.game.scale.pageAlignVertically = true;

      scale = (1 / scale);

      let gameCanvas = document.getElementById('game').children[0];
      let marginTop = (Game.viewHeight - (Game.viewHeight * scale)) / 2;
      let marginLeft = (Game.viewWidth - (Game.viewWidth * scale)) / 2;

      // gameCanvas.style.transform = 'scale('+ scale +')';
      gameCanvas.style.marginTop = -marginTop + 'px';
      gameCanvas.style.marginLeft = -marginLeft + 'px';
    }

    Game.game.stage.backgroundColor = Game.config.backgroundColor;

    Game.game.state.start('load');
  }, 1000);
};