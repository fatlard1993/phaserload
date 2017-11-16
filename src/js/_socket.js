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
        console.log('crush_ground', pos);

        // Game.entities.ground.crush(pos, 1);
        // Game.drawCurrentView();
      });

      Socket.active.on('updateMapPos', function(data){
        // if(data.id === Game.mapNames.indexOf('gas')){
        //   Game.entities.gas.create(data.x, data.y, 1, 0);
        // }
        // else
        Game.updateMapPos(data.pos, data.id);
        // Game.drawCurrentView();
      });

      Socket.active.on('player_update', function(data){
        console.log('player_update', data);

        var player = Game.config.players[data.name];

        if(data.invertTexture) player.scale.x = -Game.config.defaultPlayerScale;
        else player.scale.x = Game.config.defaultPlayerScale;

        player.angle = data.angle;

        Game.game.add.tween(player).to(data.position, data.moveTime - 150, Phaser.Easing.Sinusoidal.InOut, true);
      });

      Socket.active.on('player_connect', function(data){
        Game.notify('player connected');

        Game.config.players[data.name] = Game.entities.player.create(data);
      });

      Socket.active.on('player_disconnect', function(data){
        Game.notify('player disconnected');

        Game.config.players[data.name].kill();

        // Game.setMapPos({ x: Game.config.players[data.name].x, y: Game.config.players[data.name].y }, -1);

        delete Game.config.players[data.name];
      });
    });
  }
};