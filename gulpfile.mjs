import gulp from "gulp";
import ejs from "gulp-ejs";
import envLoader from "gulp-env-loader";
import htmlmin from "gulp-htmlmin";
import minifyInline from "gulp-minify-inline";
import size from "gulp-size";
import terser from "gulp-terser";
import yargs from "yargs";

const args = yargs(process.argv).argv;
const config = envLoader(args.config || ".env").env;
const dest = args.dist || "dist";

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

function compile() {
  return gulp
    .src(["src/*.js", "src/*.html"])
    .pipe(ejs({ ...config }))
    .pipe(gulp.dest(dest));
}

function minifyJS() {
  return gulp.src(`${dest}/*.js`).pipe(terser(terserOptions)).pipe(gulp.dest(dest));
}

function minifyHTML() {
  return gulp
    .src(`${dest}/*.html`)
    .pipe(minifyInline({ js: terserOptions }))
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(dest));
}

function printSize() {
  return gulp
    .src(`${dest}/**/*`)
    .pipe(size({ showFiles: true }))
    .pipe(gulp.dest(dest));
}

export default gulp.series(compile, gulp.parallel(minifyJS, minifyHTML), printSize);
