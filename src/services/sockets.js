const Log = require(process.env.DIR +'/_log.js');
const Cjs = require(process.env.DIR +'/_common.js');
const WebSocket = require('uws');

const Game = require(process.env.DIR +'/services/game.js');

var Sockets = {
	games: {},
	init: function(server){
		Sockets.wss = new WebSocket.Server({ server });

		Sockets.wss.on('connection', function(socket){
			Log()('\nsocket', '"Someone" connected...');

			socket.send(`{ "command": "challenge" }`);

			var validConnection = false;

			var Player = {};

			socket.onmessage = function(message){
				Log(3)(message);

				var data = JSON.parse(message.data), echo = false;

				if(data.command === 'test'){
					Log()('socket', 'test');
				}

				else if(data.command === 'challenge_response'){
					validConnection = true;

					if(data.room === 'lobby'){
						socket.send(JSON.stringify({ command: 'challenge_accept', games: Sockets.games }));
					}

					else if(data.room === 'player'){
						if(!Sockets.games[data.game_room]) return socket.send('{ "command": "goto_lobby" }');

						socket.send(JSON.stringify({ command: 'challenge_accept', players: Sockets.games[data.game_room].players }));
					}
				}

				if(!validConnection) return;

				if(data.command === 'lobby_new_game'){
					Log()('socket', 'lobby_new_game');

					Sockets.games[data.options.name] = {
						name: data.options.name,
						options: data.options,
						mapData: Game.generateMap(data.options.mode || 'normal'),
						players: {},
						spaceco: {
							parts: {},
							position: {}
						},
						addPlayer: function(playerName){
							this.players[playerName] = {
								name: playerName,
								position: {
									x: Game.rand(1, this.mapData.width - 1),
									y: 1
								},
								hull: {},
								configuration: {
									tracks: 'standard:~:steel',
									hull: 'standard:~:steel',
									drill: 'standard:~:steel',
									fuel_tank: 'standard:~:steel'
								},
								inventory: {
									teleporter: 1
								},
								fuel: 5,
								health: 100,
								credits: 0
							};

							Log()(`Player "${playerName}" joined ${this.name} | Current players: ${Object.keys(this.players)}`);

							Sockets.wss.broadcast(JSON.stringify({ command: 'player_join', room: this.name, player: this.players[playerName] }));

							Sockets.wss.broadcast(JSON.stringify({ command: 'lobby_reload', games: Sockets.games }));
						}
					};

					Sockets.games[data.options.name].spaceco.position.x = Game.rand(3, Sockets.games[data.options.name].mapData.width - 3);

					var partCount = Game.rand(13, 21), part;

					for(var x = 0; x < partCount; ++x){
						part = Game.generatePart();

						Sockets.games[data.options.name].spaceco.parts[part.name] = part.price;
					}

					Log(2)('socket', 'Created New Game: ', Sockets.games[data.options.name]);

					Sockets.wss.broadcast(JSON.stringify({ command: 'lobby_reload', games: Sockets.games }));
				}

				else if(data.command === 'player_join'){
					if(!Sockets.games[data.game_room]) return socket.send('{ "command": "goto_lobby" }');

					Player.name = data.playerName;
					Player.room = data.game_room;

					Sockets.games[Player.room].addPlayer(Player.name);

					socket.send(JSON.stringify({ command: 'player_join_accept', players: Sockets.games[Player.room].players, mapData: Sockets.games[Player.room].mapData, spaceco: Sockets.games[Player.room].spaceco }));
				}

				else if(data.command === 'player_move'){
					Sockets.games[Player.room].players[Player.name].position = data.position;

					echo = true;
				}

				else if(data.command === 'player_set_map_position'){
					var gridPos = {
						x: Game.toGridPos(data.pos.x),
						y: Game.toGridPos(data.pos.y)
					};

					Sockets.games[Player.room].mapData.map[gridPos.x][gridPos.y][0] = data.id;

					echo = true;
				}

				else if(data.command === 'player_purchase_part'){
					delete Sockets.games[Player.room].spaceco.parts[data.partName];

					echo = true;
				}

				if(echo){
					data.player = Player.name;
					data.room = Player.room;

					Sockets.wss.broadcast(JSON.stringify(data));
				}

				// delete data.command;
				// if(Object.keys(data).length) Log()('socket', 'Command data: ', data, '\n');
			};

			socket.onclose = function(data){
				Log(2)('socket', 'onclose', data);

				if(!Player.name) return Log(1)('socket', 'undefined player left');
				if(!Sockets.games[Player.room]) return Log(1)('socket', 'player left non-existent room');
				if(!Object.keys(Sockets.games[Player.room].players).includes(Player.name)) return Log(1)('socket', 'player left a room they wernt in');

				delete Sockets.games[Player.room].players[Player.name];

				Log()(`Player "${Player.name}" left ${Player.room} | Players left: ${Object.keys(Sockets.games[Player.room].players)}`);

				Sockets.wss.broadcast(JSON.stringify({ command: 'player_leave', room: Player.room, name: Player.name }));

				Sockets.wss.broadcast(JSON.stringify({ command: 'lobby_reload', games: Sockets.games }));
			};
		});

		return Sockets;
	}
};

module.exports = Sockets;