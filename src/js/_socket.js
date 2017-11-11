/* global Phaser, screenfull, io, Dom, Log, Game */

var Socket = {
  active: io.connect(window.location.protocol +'//'+ window.location.hostname, { secure: true }),
  init: function(cb){
    Socket.active.emit('connect_request', {
      name: Dom.cookie.get('name') || 'test_' + Game.rand(1, 99)
    });

    Socket.active.on('welcome', function(data){
      cb(data);

      Socket.active.on('crush_ground', function(pos){
        Game.entities.ground.crush(pos);
      });

      Socket.active.on('player_update', function(data){
        console.log('player_update', data);

        var player = Game.config.players[data.name];

        var surrounds = {
          left: Game.groundAt(player.x - Game.blockPx, player.y),
          farLeft: Game.groundAt(player.x - (Game.blockPx * 2), player.y),
          topLeft: Game.groundAt(player.x - Game.blockPx, player.y - Game.blockPx),
          top: Game.groundAt(player.x, player.y - Game.blockPx),
          topRight: Game.groundAt(player.x + Game.blockPx, player.y - Game.blockPx),
          right: Game.groundAt(player.x + Game.blockPx, player.y),
          farRight: Game.groundAt(player.x + (Game.blockPx * 2), player.y),
          bottomRight: Game.groundAt(player.x + Game.blockPx, player.y + Game.blockPx),
          bottom: Game.groundAt(player.x, player.y + Game.blockPx),
          bottomLeft: Game.groundAt(player.x - Game.blockPx, player.y + Game.blockPx)
        };

        Game.game.add.tween(player).to(data.position, data.moveTime, Phaser.Easing.Sinusoidal.InOut, true);

        var invertTexture = false;

        if(data.direction === 'up'){
          if(surrounds.left || surrounds.topLeft && !(surrounds.topRight && surrounds.topLeft && player.lastMove === 'right')){
            invertTexture = true;
            player.angle = 90;
          }
          else player.angle = -90;
        }
        else if(data.direction === 'down'){
          if(surrounds.right || surrounds.bottomRight && !(surrounds.bottomRight && surrounds.bottomLeft && player.lastMove === 'right')){
            invertTexture = true;
            player.angle = -90;
          }
          else player.angle = 90;
        }
        else{
          player.angle = 0;
        }

        if(data.direction === 'left'){
          invertTexture = true;
        }

        if(invertTexture) player.scale.x = -Game.config.defaultPlayerScale;
        else player.scale.x = Game.config.defaultPlayerScale;

        player.lastMoveInvert = invertTexture;
        player.lastMove = data.direction;

        player.lastPosition = data.position;
      });

      Socket.active.on('player_connect', function(data){
        Game.notify('player connected');

        Game.config.players[data.name] = Game.entities.player.create(data);
      });

      Socket.active.on('player_disconnect', function(data){
        Game.notify('player disconnected');

        Game.config.players[data.name].kill();

        delete Game.config.players[data.name];
      });
    });
  }
};