const fs = require('fs');
const path = require('path');

const { app, staticServer } = require('http-server');

const fontAwesomePath = path.resolve(`${__dirname}/../../node_modules/@fortawesome/fontawesome-free/webfonts`);

app.use(staticServer(path.resolve(`${__dirname}/../../src/client/resources`)));

if(fs.existsSync(fontAwesomePath)) app.use('/webfonts', staticServer(fontAwesomePath));

app.use(function(req, res, next){
	next(res.reqType === 'file' ? { code: 404, detail: `Could not find ${req.originalUrl}` } : null);
});

app.use(function(req, res, next){
	if(req.method !== 'GET' || !{ '/lobby': 1, '/game': 1 }[req.path]) return next();

	res.sendPage(req.path.slice(1));
});

app.use(function(req, res, next){
	if(res.reqType !== 'page') return next();

	res.redirect(307, '/lobby');
});