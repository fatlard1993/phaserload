const spawn = require('child_process').spawn;

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

gulp.task('default', ['compile']);

gulp.task('compile', ['compile-js', 'compile-css']);

gulp.task('develop', ['compile'], function() {
  browserSync.init({
      server: {
          baseDir: "public"
      }
  });
  gulp.watch("src/js/**/*.js", ['compile-js']);
  gulp.watch("src/scss/*.scss", ['compile-css']);
  gulp.watch("public/**/*.html").on('change', browserSync.reload);
});

gulp.task('watch', ['compile'], function(){
  gulp.watch('gulpfile.js', ['gulp-reload']);
  
  gulp.watch('src/js/*.js', ['compile-js']);
  gulp.watch('src/js/**/*.js', ['compile-js']);
  
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
    'src/js/modes/normal.js',
    'src/js/entities/player.js',
    'src/js/entities/hud.js',
    'src/js/entities/spaceco.js',
    'src/js/entities/mineral.js',
    'src/js/entities/ground.js',
    'src/js/entities/lava.js',
    'src/js/entities/monster.js',
    'src/js/states/boot.js',
    'src/js/states/load.js',
    'src/js/states/lobby.js',
    'src/js/states/play.js',
    'src/js/states/end.js'
  ]).pipe(concat('phaserload.js'))
  .pipe(gulp.dest('public/js'))
  .pipe(browserSync.stream());
});

gulp.task('compile-css', function(){
  gulp.src('src/scss/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(autoprefixer(autoprefixerOptions))
  .pipe(gulp.dest('public/css'))
  .pipe(browserSync.stream());
});
