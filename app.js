const Express = require('express'), app = Express();
const HttpServer = require('http').createServer(app);
const BodyParser = require('body-parser');
const CookieParser = require('cookie-parser');

const HttpPort = 80;

app.use(Express.static('./public'));

app.get('*', function redirectTrailingWak(req, res, next){
  var queryStringIndex = req.originalUrl.indexOf('?');
  var path = req.originalUrl.slice(0, ((queryStringIndex >= 0) ? queryStringIndex : req.originalUrl.length));

  if(path.slice(-1) !== '/') return next();

  var redirectPath = path.slice(0, (path.length - 1)) + ((queryStringIndex > -1) ? req.originalUrl.slice(queryStringIndex) : '');

  console.log('Redirecting '+ req.originalUrl +' to '+ redirectPath);

  res.redirect(301, redirectPath);
});

app.use(BodyParser.urlencoded({ extended: false }));
app.use(BodyParser.json());
app.use(CookieParser());

app.get('/test', function(req, res, next){
  console.log('Hit '+ req.path);

  res.send('test');
});

app.use(function(req, res, next){
  next({ detail: `The path ${req.path} does not exist`, status: 404 });
});

app.use(function(err, req, res, next){
  console.error('Error catch!');

  var headers = {
    '401': '401 - Unauthorized',
    '403': '403 - Forbidden',
    '404': '404 - Not Found',
    '500': '500 - Internal Server Error'
  };

  if(!err.status){
    console.error('No Error Status Provided!');

    if(err instanceof Object) err.status = 500;
    else err = { err: err, status: 500 };
  }

  console.error(err);

  var detail = err.detail || JSON.stringify(err) || 'Unknown error!';

  res.status(err.status)[req.headers.accept && req.headers.accept === 'application/json' ? 'json' : 'send'](detail);
});

HttpServer.listen(HttpPort, function(){
  console.log('HTTP server is running!');
});