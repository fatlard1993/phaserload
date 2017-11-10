const Game = require('./game.js');

var Sockets = {
  users: {},
  rooms: {},
  init: function(server){
    Sockets.io = require('socket.io').listen(server);

    Sockets.io.on('connection', function(socket){
      console.log('socket', '"Someone" connected...');

      var User;

      socket.on('connect_request', function(userData){
        console.log('User connected: ', userData);

        User = Sockets.users[userData.username] = Object.assign(userData, {
          socket: socket,
          joinRoom: function(room, roomData){
            User.leaveRoom();

            if(Sockets.rooms[room]){
              console.log('socket', room +' already exists... Adding '+ User.username +' to users list..');

              Sockets.rooms[room].users.push(User.username);

              socket.broadcast.in(room).emit('user_connect', User.username);
            }
            else{
              console.log('socket', room +' doesn\'t exist, creating room, initializing users list with '+ User.username +'..');

              var newRoomData = Object.assign(Game.generateMap(roomData && roomData.mode ? roomData.mode : 'normal'), {
                users: [User.username]
              });

              if(roomData) newRoomData = Object.assign(newRoomData, roomData);

              Sockets.rooms[room] = newRoomData;
            }

            socket.join(room);

            User.room = room;

            socket.emit('roomData', Sockets.rooms[room]);
          },
          leaveRoom: function(){
            if(User.room && Sockets.rooms[User.room]){
              Sockets.rooms[User.room].users.splice(Sockets.rooms[User.room].users.indexOf(User.username), 1);

              if(!Sockets.rooms[User.room].users.length){
                console.log('socket', 'Room is now empty, tearing down room..');

                delete Sockets.rooms[User.room];
              }
              else{
                console.log('socket', 'There are '+ Sockets.rooms[User.room].users.length +' uses left in '+ User.room);

                Sockets.io.in(User.room).emit('user_disconnect', User.username);
              }
            }
          },
          disconnect: function(){
            if(!Sockets.users[User.username]) return console.warn('socket', 'Disconnecting "'+ User.username +'"..');

            delete Sockets.users[User.username];

            User.leaveRoom();

            User = null;
          }
        });

        socket.emit('welcome', { rooms: Object.keys(Sockets.rooms) });
      });

      socket.on('create_room', function(roomData){
        console.log('create_room', roomData);

        User.joinRoom(roomData.name, roomData);
      });

      socket.on('join_room', function(roomName){
        console.log('join_room', roomName);

        User.joinRoom(roomName);
      });

      socket.on('join_room', function(roomName){
        console.log('join_room', roomName);

        User.joinRoom(roomName);
      });

      socket.on('crush_ground', function(pos){
        console.log('crush_ground', pos);

        Sockets.rooms[User.room].map[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)][0] = -1;
        Sockets.rooms[User.room].viewBufferMap[Game.toGridPos(pos.x)][Game.toGridPos(pos.y)][0] = -1;

        Sockets.io.in(User.room).emit('crush_ground', pos);
      });

      socket.on('disconnect', function(){
        if(!User || !User.username) return console.warn('socket', 'Undefined user left!');

        console.log('socket', User.username +' left '+ User.socketRoom);

        User.disconnect();
      });
    });

    return Sockets;
  },
  emitTo: function(destination, event, content){
    console.log('socket', 'Sending '+ event +' to '+ destination);
    if(content) console.log('socket', 'Event content: ', content);

    if(destination === '*') Sockets.io.sockets.emit(event, content);

    else if(Sockets.rooms[destination]) Sockets.io.sockets.in(destination).emit(event, content);

    else if(Sockets.users[destination]) Sockets.users[destination].socket.emit(event, content);

    else  console.warn('socket', 'Could not find '+ destination);
  }
};

module.exports = Sockets;