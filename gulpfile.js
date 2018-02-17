const fs = require('fs');
const exec = require('child_process').exec;

const gulp = require('gulp');
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');//&& babel-core && babel-preset-env
const concat = require('gulp-concat');

const Log = require('./src/js/_log.js');

const autoprefixerOptions = {
	flexBox: 'no-2009',
	browsers: ['last 10 versions'],
	cascade: false
};

const babelOptions = {
	presets: ['env']
};

function browse(folder, cb){
	var folders = [];

	exec('ls -d "'+ folder +'"/*/', function(err, stdout){
		var folderNames = stdout.split('\n');

		folderNames.forEach(function(folderName){
			if(folderName && folderName.length) folders.push(/\/([^\/]*?)\/$/.exec(folderName)[1]);
		});

		var files = [];

		exec('ls -p "'+ folder +'/" | grep -v /', function(err, stdout){
			var fileNames = stdout.split('\n');

			fileNames.forEach(function(fileName){
				if(fileName && fileName.length) files.push(fileName);
			});

			cb({ folder: folder, folders: folders, files: files });
		});
	});
}

function concatJS(name, files, applyBabel){
	Log(1)('building js file: ', name, files, 'with'+ (applyBabel ? '' : ' NO') +' babel');

	var proc = gulp.src(files).pipe(concat(name +'.js'));

	if(applyBabel) proc.pipe(babel(babelOptions));

	proc.pipe(gulp.dest('out/resources/js'));
}

function createHTML(name, includes){
	var htmlIncludes = includes.slice(0);
	htmlIncludes.push(name +'.js');
	htmlIncludes.push(name +'.css');

	Log(1)('building html file: ', name, htmlIncludes);

	var includesHTML = '';
	for(var x = 0; x < htmlIncludes.length; x++){
		includesHTML += '\n\t\t'+ (htmlIncludes[x].endsWith('.js') ? '<script src="/js/'+ htmlIncludes[x] +'"></script>' : '<link rel="stylesheet" href="/css/'+ htmlIncludes[x] +'">');
	}

	fs.writeFile('./out/resources/html/_includes_'+ name +'.html', includesHTML, function(){
		gulp.src([
			'./src/html/_start.html',
			'./out/resources/html/_includes_'+ name +'.html',
			'./src/html/_pageEnd.html',
		]).pipe(concat('_'+ name +'_01.html')).pipe(gulp.dest('out/resources/html')).on('finish', function(){
			exec('sed -e "s/XXX/'+ name.charAt(0).toUpperCase() + name.slice(1) +'/g" ./out/resources/html/_'+ name +'_01.html > ./out/resources/html/'+ name +'.html');
			exec('cd ./out/resources/html && rm ./_'+ name +'_01.html ./_includes_'+ name +'.html');
		});
	});
}

gulp.task('compile', ['generate-html', 'uglify-js', 'uglify-css', 'update-server-files']);

gulp.task('compile-dev', ['generate-html', 'compile-js', 'compile-css', 'update-server-files']);

gulp.task('dev', ['compile-dev', 'notify-done']);

gulp.task('setup', ['compile-dev', 'npm-install', 'notify-done']);

gulp.task('notify-done', function(){
	exec('notify-send done!');

	exec('curl localhost/dev || wget localhost/dev');
});

gulp.task('npm-install', function(){
	exec('sleep 2s && cd ./out && npm i', function(err){
		if(err) return Log.error()(err);

		Log()('Installed npm packages!');
	});
});

gulp.task('update-server-files', function(){
	gulp.src('src/app.js').pipe(gulp.dest('out'));

	gulp.src('src/scripts/start').pipe(gulp.dest('out'));

	gulp.src('src/middleware/*').pipe(gulp.dest('out/middleware'));

	gulp.src('src/services/*').pipe(gulp.dest('out/services'));

	gulp.src('src/assets/*').pipe(gulp.dest('out/resources/assets'));

	gulp.src('src/package.json').pipe(gulp.dest('out'));

	gulp.src('./src/_logo').pipe(gulp.dest('out'));

	gulp.src('./fonts/*').pipe(gulp.dest('out/resources/fonts'));

	gulp.src('./src/js/_log.js').pipe(gulp.dest('out'));

	gulp.src('./src/js/_common.js').pipe(gulp.dest('out'));
});

gulp.task('compile-js', function(){
	browse('./src/js', function(data){
		Log(2)(data);

		for(var x = 0; x < data.folders.length; x++){
			browse(data.folder +'/'+ data.folders[x], function(folderData){
				Log(2)(folderData);

				var outputSettings;

				if(folderData.files.includes('output.json')){
					folderData.files.splice(folderData.files.indexOf('output.json'), 1);

					Log(2)('reading: '+ folderData.folder +'/output.json');
					fs.readFile(folderData.folder +'/output.json', function(err, data){
						outputSettings = JSON.parse(data);

						Log(2)(outputSettings);

						for(var y = 0; y < folderData.files.length; y++){
							folderData.files[y] = folderData.folder +'/'+ folderData.files[y];
						}

						if(outputSettings && outputSettings.includes) folderData.files = outputSettings.includes.concat(folderData.files);

						var name = folderData.folder.replace(/\.?\.?\/(\w+\/)+/, '');

						concatJS(name, folderData.files, outputSettings ? outputSettings.babel : false);
					});
				}
			});
		}
	});
});

gulp.task('uglify-js', ['compile-js'], function(){
	gulp.src('out/resources/js/*.js').pipe(uglify()).pipe(gulp.dest('out/resources/js'));
});

gulp.task('generate-html', function(){
	exec('mkdir -p ./out/resources/html');

	gulp.src([
		'./src/html/_start.html',
		'./src/html/_errorEnd.html',
	]).pipe(concat('error.html')).pipe(gulp.dest('out/resources/html'));

	fs.readFile('./src/html/output.json', function(err, data){
		if(data){
			var outputSettings = JSON.parse(data);
			Log(2)(outputSettings);

			var pageNames = Object.keys(outputSettings.pages), pageCount = pageNames.length;

			for(var x = 0; x < pageCount; ++x){
				createHTML(pageNames[x], outputSettings.pages[pageNames[x]].includes);
			}
		}
	});
});

gulp.task('compile-css', function(){
	gulp.src('src/scss/*.scss').pipe(sass().on('error', sass.logError)).pipe(autoprefixer(autoprefixerOptions)).pipe(gulp.dest('out/resources/css'));
});

gulp.task('uglify-css', ['compile-css'], function(){
	gulp.src('out/resources/css/*.css').pipe(cleanCSS()).pipe(gulp.dest('out/resources/css'));
});