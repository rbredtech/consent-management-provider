import gulp from "gulp";
import htmlmin from "gulp-htmlmin";
import minifyInline from "gulp-minify-inline";
import size from "gulp-size";
import sourcemaps from "gulp-sourcemaps";
import stringReplace from "gulp-string-replace";
import terser from "gulp-terser";
import ts from "gulp-typescript";

var { BUILD_NUMBER } = process.env;

var tsProject = ts.createProject("tsconfig.json");

const terserOptions = {
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

function setSourceHashParam() {
  return gulp
    .src("./dist/templates/*")
    .pipe(stringReplace("<%-BUILD_NUMBER%>", BUILD_NUMBER ?? ""))
    .pipe(gulp.dest("./dist/templates"));
}

function minifyJsTemplates() {
  return gulp.src("./dist/templates/*.js").pipe(terser(terserOptions)).pipe(gulp.dest("./dist/templates"));
}

function minifyHtmlTemplates() {
  return gulp
    .src("./dist/templates/*.html")
    .pipe(minifyInline({ js: terserOptions }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("./dist/templates"));
}

function printSize() {
  return gulp
    .src("./dist/templates/*")
    .pipe(size({ gzip: true, uncompressed: true, showFiles: true }))
    .pipe(gulp.dest("dist/templates"));
}

export default gulp.series(
  typescript,
  copyTemplates,
  setSourceHashParam,
  minifyJsTemplates,
  minifyHtmlTemplates,
  printSize,
);
