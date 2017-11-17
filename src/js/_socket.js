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

      Socket.active.on('offer', function(data){
        console.log('offer', data);

        Game.tradeOffer = data;

        Game.offer_accepted = Game.offer_sent_accept = 0;

        Game.entities.player.setView(Game.hud.view);
      });

      Socket.active.on('offer_accept', function(){
        console.log('offer_accept');

        Game.offer_accepted = 1;

        if(Game.offer_sent_accept){
          var itemNames = Object.keys(Game.tradeOffer), x;

          for(x = 0; x < itemNames.length; x++){
            Game.inventory[itemNames[x]] = Game.inventory[itemNames[x]] || 0;

            Game.inventory[itemNames[x]] += Game.tradeOffer[itemNames[x]];
          }

          itemNames = Object.keys(Game.offer);

          for(x = 0; x < itemNames.length; x++){
            Game.inventory[itemNames[x]] -= Game.offer[itemNames[x]];

            if(Game.inventory[itemNames[x]] <= 0) delete Game.inventory[itemNames[x]];
          }

          Game.offer = {};
          Game.tradeOffer = {};
          Game.offer_sent_accept = Game.offer_accepted = 0;

          Game.entities.player.setView('trade');
        }

        else Game.hud.bottomLine.setText('       - offer accepted -');
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