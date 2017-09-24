const spawn = require('child_process').spawn;

const gulp = require('gulp');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');

const autoprefixerOptions = {
  flexBox: 'no-2009',
  browsers: ['last 2 versions', '> 1%'],
  cascade: false
};

gulp.task('default', ['compile']);

gulp.task('compile', ['compile-js', 'compile-css']);

gulp.task('watch', ['compile'], function(){
  gulp.watch('gulpfile.js', ['gulp-reload']);
  
  gulp.watch('src/js/*.js', ['compile-js']);
  
  gulp.watch('src/scss/*.scss', ['compile-css']);
});

gulp.task('gulp-reload', function(){
  spawn('gulp', ['watch'], { stdio: 'inherit' });

  process.exit();
});

gulp.task('compile-js', function(){
  gulp.src([
    'src/js/lib/phaser.js',
    'src/js/_polyfill.js',
    'src/js/_log.js',
    'src/js/game.js',
    'src/js/entities/player.js',
    'src/js/entities/ground.js',
    'src/js/entities/lava.js',
    'src/js/entities/monster.js',
    'src/js/states/boot.js',
    'src/js/states/load.js',
    'src/js/states/lobby.js',
    'src/js/states/game.js',
    'src/js/states/end.js'
  ]).pipe(concat('phaserload.js')).pipe(gulp.dest('public/js'));
});

gulp.task('compile-css', function(){
  gulp.src('src/scss/*.scss').pipe(sass().on('error', sass.logError)).pipe(autoprefixer(autoprefixerOptions)).pipe(gulp.dest('public/css'));  
});