const fs = require('fs');
const exec = require('child_process').exec;

const express = require('express'), app = express();
const httpServer = require('http').createServer(app);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const Log = require(process.env.DIR +'/_log.js');
const Errors = require(process.env.DIR +'/middleware/error.js');
const Sockets = require(process.env.DIR +'/services/sockets.js');

const VERSION = '0.3.dev';

const PORT = process.env.PORT || 80;

(function start(){
	initExpress(function(){
		Sockets.active = Sockets.init(httpServer);

		Log()(`-	Version ${VERSION}		-\n`);
	});
})();

function initExpress(cb){
	app.get('/test', function(req, res, next){
		Log()('Testing...');
		res.send('test');
	});

	app.get('/dev', function(req, res, next){
		Log()('Reloading clients...');

		Sockets.wss.broadcast(JSON.stringify({ command: 'reload', delay: 1500 }));

		res.send('ack');
	});

	app.get('/', function(req, res, next){
		res.redirect('/lobby');
	});

	app.use(express.static(process.env.DIR +'/resources'));

	app.get('*', function redirectTrailingWak(req, res, next){
		var queryStringIndex = req.originalUrl.indexOf('?');
		var path = req.originalUrl.slice(0, ((queryStringIndex >= 0) ? queryStringIndex : req.originalUrl.length));

		if(path.slice(-1) !== '/') return next();

		var redirectPath = path.slice(0, (path.length - 1)) + ((queryStringIndex > -1) ? req.originalUrl.slice(queryStringIndex) : '');

		res.redirect(301, redirectPath);
		Log()('301 redirected '+ req.originalUrl +' to '+ redirectPath);
	});

	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(cookieParser());

	app.get('/lobby*', function(req, res, next){
		Log()('Load lobby', req.socket.remoteAddress);

		res.sendFile(process.env.DIR +'/resources/html/lobby.html');
	});

	app.get('/player*', function(req, res, next){
		Log()('Load player', req.socket.remoteAddress, req.query.room);

		if(req.query.room && !Sockets.games[req.query.room]) return res.redirect(301, '/lobby');

		res.sendFile(process.env.DIR +'/resources/html/player.html');
	});

	app.use(Errors.four0four);

	app.use(Errors.catch);

	Log()('Request router loaded!');

	try{
		httpServer.listen(PORT, function(){
			Log()('HTTP server is running at port: '+ PORT);

			fs.readFile(process.env.DIR +'/_logo', function(err, data){
				process.stdout.write(data);

				cb();
			});
		});
	}
	catch(e){
		Log.error()(e);
		Log()('Maybe node is already running?');
	}
}