const Log = require(process.env.DIR +'/_log.js');
const Execute = require('child_process').exec;

var headers = {
	'401': '401 - Unauthorized',
	'403': '403 - Forbidden',
	'404': '404 - Not Found',
	'500': '500 - Internal Server Error'
};

module.exports = {
	four0four: function(req, res, next){
		Log.warn()('404 catch '+ req.originalUrl);
		next({ detail: 'The requested page does not exist', status: 404 });
	},
	catch: function(err, req, res, next){
		Log.error()('Middleware error catch!');
		if(!err.status){
			Log.error()('No Error Status Provided!');
			if(err instanceof Object) err.status = 500;
			else err = { err: err, status: 500 };
		}

		var detail = err.detail || JSON.stringify(err) || 'Unknown error!';

		Log.error()(err);

		if(req.headers.accept && req.headers.accept === 'application/json') return res.status(err.status).json(detail);

		if(err.redirectPath){
			Log()('Redirecting to: '+ err.redirectPath);
			res.redirect(307, err.redirectPath);
		}

		var cmd = "(cd "+ process.env.DIR +"/resources/html && sed -e 's/XXX/"+ (headers[err.status] || err.status) +"/g' -e 's/YYY/"+ detail +"/g' error.html > ./error_"+ err.status +".html)";
		Execute(cmd, function(){ res.sendFile(process.env.DIR +'/resources/html/error_'+ err.status +'.html'); });
	}
};