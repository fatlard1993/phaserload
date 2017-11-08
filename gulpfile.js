const fs = require('fs');

const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const browserSync = require('browser-sync').create();

const autoprefixerOptions = {
  flexBox: 'no-2009',
  browsers: ['last 2 versions', '> 1%'],
  cascade: false
};

const browserSyncOptions = {
  server: {
    baseDir: 'public'
  }
};

gulp.task('default', ['compile']);

gulp.task('dev', ['compile'], function(){
  // browserSync.init(browserSyncOptions);

  gulp.watch('src/js/**/*.js', ['compile-js']);
  gulp.watch('src/scss/*.scss', ['compile-css']);
  gulp.watch('src/*.html', ['update-html']);
});

gulp.task('compile', ['compile-js', 'compile-css', 'update-html']);

gulp.task('compile-js', function(){
  fs.readFile('src/js/output.json', function(err, data){
    var outputSettings = JSON.parse(data);

    console.log(outputSettings);

    var proc = gulp.src(outputSettings.includes).pipe(concat(outputSettings.name));

    proc.pipe(gulp.dest('public/js')).pipe(browserSync.stream());
  });
});

gulp.task('compile-css', function(){
  var proc = gulp.src('src/scss/*.scss').pipe(sass().on('error', sass.logError));

  proc.pipe(autoprefixer(autoprefixerOptions)).pipe(gulp.dest('public/css')).pipe(browserSync.stream());
});

gulp.task('update-html', function(){
  gulp.src('src/*.html').pipe(gulp.dest('public')).pipe(browserSync.stream());
});