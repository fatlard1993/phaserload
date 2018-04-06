const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const express = require('express'), app = express();
const httpServer = require('http').createServer(app);
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const Log = require(process.env.DIST ? `${__dirname}/_log` : `${__dirname}/../../swiss-army-knife/js/_log`);

const Errors = require(`${__dirname}/middleware/error`);

const Sockets = require(`${__dirname}/services/sockets`);
const Modes = require(`${__dirname}/services/_modes`);
const Worlds = require(`${__dirname}/services/_worlds`);

const VERSION = '0.3.dev';

const PORT = process.env.PORT || 80;

(function start(){
	initExpress(function(){
		Sockets.active = Sockets.init(httpServer);

		Log()(`-	Version ${VERSION}		-\n`);

		Modes.init();
		Worlds.init();
	});
})();

function initExpress(cb){
	var publicPath = path.join(__dirname, process.env.DIST ? '/public' : '../client/public');

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

	app.use(express.static(publicPath));

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

	app.use('/:page', function(req, res, next){
		if(!{ lobby: 1, player: 1 }[req.params.page]) return next();

		Log()(`Load ${req.params.page}`, req.socket.remoteAddress);

		res.sendFile(`${publicPath}/html/${req.params.page}.html`);
	});

	app.use(Errors.four0four);

	app.use(Errors.catch);

	Log()('Request router loaded!');

	try{
		httpServer.listen(PORT, function(){
			Log()('HTTP server is running at port: '+ PORT);

			fs.readFile(`${__dirname}/_logo`, function(err, data){
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