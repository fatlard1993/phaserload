const Game = require('./game.js');

var Sockets = {
  players: {},
  rooms: {},
  init: function(server){
    Sockets.io = require('socket.io').listen(server);

    Sockets.io.on('connection', function(socket){
      console.log('socket', '"Someone" connected...');

      var Player;

      socket.on('connect_request', function(data){
        console.log('Player connected: ', data);

        Player = Sockets.players[data.name] = Object.assign(data, {
          socket: socket,
          joinRoom: function(room, roomData){
            Player.leaveRoom();

            socket.join(room);

            Player.room = room;

            if(!Sockets.rooms[room]){
              console.log('socket', room +' doesn\'t exist, creating room, initializing players list with '+ Player.name +'..');

              var newRoomData = Object.assign(Game.generateMap(roomData && roomData.mode ? roomData.mode : 'normal'), { players: {} });

              if(roomData) newRoomData = Object.assign(newRoomData, roomData);

              Sockets.rooms[room] = newRoomData;

              Sockets.rooms[room].spaceco = {
                parts: {},
                position: {
                  x: Game.rand(3, Sockets.rooms[room].width - 3)
                }
              };

              var partNames = Game.shuffleArr(Object.keys(Game.parts));

              // partNames.length = Game.rand(4, 9);

              for(var x = 0; x < partNames.length; x++){
                Sockets.rooms[room].spaceco.parts[partNames[x]] = Game.parts[partNames[x]];
              }
            }

            Sockets.rooms[room].players[Player.name] = {
              name: Player.name,
              position: {
                x: Game.rand(1, Sockets.rooms[room].width - 1)
              }
            };

            socket.broadcast.to(room).emit('player_connect', Sockets.rooms[room].players[Player.name]);

            socket.emit('roomData', Sockets.rooms[room]);
          },
          leaveRoom: function(){
            if(Player.room && Sockets.rooms[Player.room]){
              if(!(Object.keys(Sockets.rooms[Player.room].players).length - 1)){
                console.log('socket', 'Room is now empty, tearing down room..');

                delete Sockets.rooms[Player.room];
              }
              else{
                console.log('socket', 'There are '+ (Object.keys(Sockets.rooms[Player.room].players).length - 1) +' players left in '+ Player.room);

                Sockets.io.in(Player.room).emit('player_disconnect', Sockets.rooms[Player.room].players[Player.name]);

                delete Sockets.rooms[Player.room].players[Player.name];
              }
            }
          },
          disconnect: function(){
            if(!Sockets.players[Player.name]) return console.warn('socket', 'Disconnecting "'+ Player.name +'"..');

            delete Sockets.players[Player.name];

            Player.leaveRoom();

            Player = null;
          }
        });

        socket.emit('welcome', { name: Player.name, rooms: Object.keys(Sockets.rooms) });
      });

      socket.on('create_room', function(roomData){
        if(!Player) return;

        console.log('create_room', roomData);

        Player.joinRoom(roomData.name, roomData);
      });

      socket.on('join_room', function(roomName){
        if(!Player) return;

        console.log('join_room', roomName);

        Player.joinRoom(roomName);
      });

      socket.on('setMapPos', function(data){
        if(!Player) return;

        console.log('updateMapPos', data.pos, 'from', Game.toName(Sockets.rooms[Player.room].map[data.pos.x][data.pos.y][0]), 'to', Game.mapNames[data.id]);

        Sockets.rooms[Player.room].map[data.pos.x][data.pos.y][0] = data.id;

        socket.broadcast.to(Player.room).emit('updateMapPos', data);
      });

      socket.on('player_update', function(data){
        if(!Player) return;

        console.log('player_update', data);

        Sockets.rooms[Player.room].players[Player.name].position = {
          x: Game.toGridPos(data.position.x),
          y: Game.toGridPos(data.position.y)
        };

        data.name = Player.name;

        socket.broadcast.to(Player.room).emit('player_update', data);
      });

      socket.on('offer', function(data){
        if(!Player) return;

        console.log('offer', data);

        if(data.accept) return Sockets.emitTo(data.to, 'offer_accept');

        Sockets.emitTo(data.to, 'offer', data.offer);
      });

      socket.on('crush_ground', function(pos){
        if(!Player) return;

        console.log('crush_ground', pos);

        Sockets.io.in(Player.room).emit('crush_ground', pos);
      });

      socket.on('disconnect', function(){
        if(!Player || !Player.name) return console.warn('socket', 'Undefined player left!');

        console.log('socket', Player.name +' left '+ Player.socketRoom);

        Player.disconnect();
      });
    });

    return Sockets;
  },
  emitTo: function(destination, event, content){
    console.log('socket', 'Sending '+ event +' to '+ destination);
    if(content) console.log('socket', 'Event content: ', content);

    if(destination === '*') Sockets.io.sockets.emit(event, content);

    else if(Sockets.rooms[destination]) Sockets.io.sockets.in(destination).emit(event, content);

    else if(Sockets.players[destination]) Sockets.players[destination].socket.emit(event, content);

    else  console.warn('socket', 'Could not find '+ destination);
  }
};

module.exports = Sockets;