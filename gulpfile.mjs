import gulp from "gulp";
import ejs from "gulp-ejs";
import envLoader from "gulp-env-loader";
import htmlmin from "gulp-htmlmin";
import minifyInline from "gulp-minify-inline";
import size from "gulp-size";
import terser from "gulp-terser";
import yargs from "yargs";

const config = envLoader(yargs(process.argv).argv.config || ".env").env;

ejs.__EJS__.delimiter = "*";
ejs.__EJS__.openDelimiter = "__ejs(/";
ejs.__EJS__.closeDelimiter = "/);";

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

function compileTemplates() {
  return gulp
    .src(["./src/*.js", "./src/*.html"])
    .pipe(ejs({ ...config }))
    .pipe(gulp.dest("./dist"));
}

function minifyJsTemplates() {
  return gulp.src("./dist/*.js").pipe(terser(terserOptions)).pipe(gulp.dest("./dist"));
}

function minifyHtmlTemplates() {
  return gulp
    .src("./dist/*.html")
    .pipe(minifyInline({ js: terserOptions }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest("./dist"));
}

function printSize() {
  return gulp
    .src("./dist/*")
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest("dist"));
}

export default gulp.series(compileTemplates, minifyJsTemplates, minifyHtmlTemplates, printSize);
