const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
var path = require('path');

function handleError(error) {
  console.log(error.toString());
  this.emit('end');
  process.exit(1);
}

gulp.task('default', () =>
  gulp.src('src/**/*.js')
  .pipe(sourcemaps.init())
  .pipe(babel())
  .on('error', handleError)
  .pipe(sourcemaps.write('.', { sourceRoot: path.join('../src/') }))
  .pipe(gulp.dest('dist'))
);
