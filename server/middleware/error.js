const Execute = require('child_process').exec;

const Log = require(process.env.DIST ? `${__dirname}/../_log` : `${__dirname}/../../../swiss-army-knife/js/_log`);

var headers = {
	'401': '401 - Unauthorized',
	'403': '403 - Forbidden',
	'404': '404 - Not Found',
	'500': '500 - Internal Server Error'
};

module.exports = {
	four0four: function(req, res, next){
		Log.warn()(`The path "${req.originalUrl}" does not exist`);
		next({ detail: `The requested path does not exist`, status: 404 });
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
			if(err.status === 401) res.clearCookie('sessionID');
			return res.redirect(307, err.redirectPath);
		}

		var htmlPath = process.env.DIST ? `${__dirname}/../public/html` : `${__dirname}/../../client/public/html`;

		Execute(`(cd ${htmlPath} && sed -e 's/XXX/${(headers[err.status] || err.status)}/g' -e 's/YYY/${detail}/g' error.html > ./error_${err.status}.html)`, function(){
			res.sendFile(`error_${err.status}.html`, { root: htmlPath });
		});
	}
};