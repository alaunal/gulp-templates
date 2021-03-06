/*
 *
 * A simple Gulp 4 Starter Kit templates
 *
 * @author A.kauniyyah <a.kauniyyah@go-jek.com>
 * @copyright 2019 A.kauniyyah | Sr. Front-end Web developer
 *
 * ________________________________________________________________________________
 *
 * gulpfile.js
 *
 * The gulp task runner file.
 *
 */

// -- General 
const gulp = require('gulp');
const del = require('del');
const header = require('gulp-header');
const sourcemaps = require('gulp-sourcemaps');
const noop = require('gulp-noop');
const cache = require('gulp-cached');
const pump = require('pump');
const browserSync = require('browser-sync').create();
const runSequence = require('gulp4-run-sequence');
const plumber = require('gulp-plumber');
const path = require("path");

// -- config
const package = require('./package.json');
const config = require('./gulpfile.config');
const siteConf = require('./site.config');

// -- Styles
const sass = require('gulp-sass');
const cleanCss = require('gulp-clean-css');
const postcss = require('gulp-postcss');
const autoprefixer = require('gulp-autoprefixer');
const cssnano = require('cssnano');
const csso = require('gulp-csso');

// -- HTML templates nunjuncks
const nunjucksRender = require('gulp-nunjucks-render');
const beautify = require('gulp-jsbeautifier');
const data = require('gulp-data');

// -- scripts
const terser = require('gulp-terser');
const optimizejs = require('gulp-optimize-js');
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const babel = require('gulp-babel');
const strip = require('gulp-strip-comments');
const named = require('vinyl-named');

// ---------------------------------------------------
// -- FUNCTION OF HELPERS
// ---------------------------------------------------


// -- fetch command line arguments

const arg = (argList => {
    let arg = {},
        a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {
        thisOpt = argList[a].trim();
        opt = thisOpt.replace(/^\-+/, '');
        if (opt === thisOpt) {
            if (curOpt) arg[curOpt] = opt;
            curOpt = null;
        } else {
            curOpt = opt;
            arg[curOpt] = true;
        }
    }
    return arg;
})(process.argv);

// -- Environment configuration.

const isProd = arg.production === true;


// ---------------------------------------------------
// -- GULP TASKS
// ---------------------------------------------------

// -- clean of build dir

gulp.task('clean', () => del(['./build']));

// -- clean of cache

gulp.task('clear-cache', done => {
    cache.caches = {};

    done();
});

// -- Run Server and reload setup

gulp.task('runServer', () => {
    return browserSync.init({
        server: {
            baseDir: ['build']
        },
        port: arg.port ? Number(arg.port) : 8080,
        open: true
    });
});

gulp.task('reload', done => {
    browserSync.reload();
    done();
});

// -- Scss of styles task runner compile

gulp.task('compile-styles', done => {

    if (!config.settings.styles) return done();

    pump([
        gulp.src(config.paths.styles.input),
        (isProd ? noop() : sourcemaps.init()),
        sass({
            outputStyle: 'compressed'
        }).on('error', sass.logError),
        autoprefixer(),
        postcss([
            cssnano({
                discardComments: {
                    removeAll: true
                }
            })
        ]),
        csso(),
        cleanCss({
            level: {
                1: {
                    specialComments: 0
                }
            }
        }),
        (isProd ? noop() : sourcemaps.write('./maps')),
        header(config.header.main, {
            package: package
        }),
        gulp.dest(config.paths.styles.output)
    ]);

    done();
});

// -- Script js use rollup

gulp.task('compile-scripts', done => {
    if (!config.settings.scripts) return done();

    return gulp.src(config.paths.scripts.dir + '*.js')
        .pipe(plumber())
        .pipe(named())
        .pipe(webpackStream({
            mode: isProd ? 'production' : 'development',
            output: {
                chunkFilename: 'module.[hash].js',
                publicPath: "static/js/",
                path: path.resolve(__dirname, "static/js"),
            },
            optimization: {
                splitChunks: {
                    chunks: 'all',
                },
            },
        }, webpack))
        .pipe(isProd ? noop() : sourcemaps.init())
        .pipe(babel())
        .pipe(terser(isProd ? config.uglify.prod : config.uglify.dev))
        .pipe(optimizejs())
        .pipe(strip())
        .pipe((isProd ? noop() : sourcemaps.write('./maps')))
        .pipe(header(config.header.main, {
            package: package
        }))
        .pipe(gulp.dest(config.paths.scripts.output));
});

// -- Copy of static when of changed

gulp.task('copy-static', () => {
    return gulp.src(config.paths.libs + '**/*')
        .pipe(gulp.dest(config.paths.output));
});

// -- Nunjucks html template compile 

gulp.task('compile-html', done => {

    if (!config.settings.copy) return done();

    return gulp.src(config.paths.public.input)
        .pipe(plumber())
        .pipe(data(function() {
            return siteConf.data;
        }))
        .pipe(nunjucksRender({
            path: [config.paths.html]
        }))
        .pipe(beautify({
            html: {
                indent_size: 2,
                indent_char: ' ',
                max_preserve_newlines: 1
            }
        }))
        .pipe(gulp.dest(config.paths.build));

});

// -- Compile task runner

gulp.task('gulp:compile', function(callback) {
    runSequence(
        'clear-cache',
        'compile-styles',
        'compile-scripts',
        'compile-html',
        'copy-static',
        callback
    );
});

// -- watch task runner

gulp.task('gulp:watch', () => {
    gulp.watch(config.paths.src, callback => {
        runSequence(
            'gulp:compile',
            'reload',
            callback
        );
    });
});

// -- task serve

gulp.task('gulp:serve', (callback) => {
    runSequence(
        'gulp:compile',
        [
            'runServer', 'gulp:watch'
        ],
        callback
    );
});

// -- task default

gulp.task('default', gulp.series('clean', 'gulp:compile'));