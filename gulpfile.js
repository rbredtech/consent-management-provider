var gulp = require("gulp");
var ts = require("gulp-typescript");
var sourcemaps = require("gulp-sourcemaps");
var terser = require("gulp-terser");

var tsProject = ts.createProject("tsconfig.json");

var terserOptions = {
  compress: {
    arrows: false,
    booleans: false,
    comparisons: false,
    conditionals: false,
    drop_console: true,
    evaluate: false,
    if_return: false,
    keep_fargs: true,
    negate_iife: false,
    properties: false,
    typeofs: false,
  },
  mangle: {
    toplevel: true,
  },
};

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
  return gulp.src("./dist/templates/*.js").pipe(terser(terserOptions)).pipe(gulp.dest("./dist/templates"));
}

exports.default = gulp.series(typescript, copyTemplates, minifyJsTemplates);
