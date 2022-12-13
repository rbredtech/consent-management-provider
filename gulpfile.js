var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var uglify = require("gulp-uglify");

var tsProject = ts.createProject("tsconfig.json");

function typescript() {
  return tsProject
    .src()
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write(".", { sourceRoot: "./", includeContent: false }))
    .pipe(gulp.dest("dist"));
}

function copyTemplates() {
  return gulp.src("./src/templates/*").pipe(gulp.dest("./dist/templates"));
}

function minifyJsTemplates() {
  return gulp
    .src("./dist/templates/*.js")
    .pipe(
      uglify({
        compress: {
          arguments: false,
          arrows: false,
          assignments: false,
          booleans: false,
          comparisons: false,
          conditionals: false,
          evaluate: false,
          if_return: false,
          keep_fargs: true,
          keep_fnames: true,
        },
      }),
    )
    .pipe(gulp.dest("./dist/templates"));
}

exports.default = gulp.series(typescript, copyTemplates, minifyJsTemplates);
