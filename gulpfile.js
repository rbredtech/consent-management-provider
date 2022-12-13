var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");

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

exports.default = gulp.series(typescript, copyTemplates);
