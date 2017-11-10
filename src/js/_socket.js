/* global Phaser, screenfull, io, Dom, Log, Game */

var Socket = {
  active: io.connect(window.location.protocol +'//'+ window.location.hostname, { secure: true }),
  init: function(cb){
    Socket.active.emit('connect_request', {
      username: Dom.cookie.get('username') || 'test_' + Game.rand(1, 99)
    });

    Socket.active.on('welcome', function(data){
      cb(data);
    });
  }
};