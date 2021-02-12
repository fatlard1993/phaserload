const { app, staticServer } = require('http-server');

const { rootPath } = require('./phaserload');

app.use(
	staticServer(rootPath('src/client/resources')),
	staticServer(rootPath('node_modules/@fortawesome/fontawesome-free')),
	staticServer(rootPath('node_modules/source-code-pro'))
);

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