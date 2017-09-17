import gulp from 'gulp';
import { src as src, dest as dst } from 'gulp';
import { log } from 'gulp-util';
import linter from 'gulp-eslint';
import rename from 'gulp-rename';
import uglify from 'gulp-uglify';
import vinyl_src from 'vinyl-source-stream';
import vinyl_buffer from 'vinyl-buffer';
import browserify from 'browserify';
import babelify from 'babelify';
import watchify from 'watchify';
import mocha from 'gulp-mocha';
import jsdoc from 'gulp-jsdoc3';

const task = (name, deps, fn) => gulp.task(name, deps, fn),
    watch = (files, task) => gulp.watch(files, task);

const api = ['lib/cost-functions.js', 'lib/sim-functions.js'],
    all_js = ['lib/index.js', 'test.js'].concat(api);

task('lint', _ =>
    src(all_js)
    .pipe(linter(
    {
        rules: {},
        useEslintrc: false,
        envs: ['browser', 'node', 'mocha'],
        extends: 'eslint:recommended',
        baseConfig: { parserOptions: { ecmaVersion: 6, sourceType: 'module' } }
    }))
    .pipe(linter.format('stylish'))
    .pipe(linter.failAfterError()));

const brow_opts = {
    entries: ['lib/index.js'],
    transform: [
        ['babelify', { presets: ['es2015'] }]
    ],
    standalone: 'symlar',
    debug: true,
    cache: {},
    packageCache: {}
};

//----DEV-----
task('dev-compile', ['lint'], _ =>
    browserify(brow_opts)
    .plugin(watchify)
    .bundle()
    .on('error', err => log(err.message))
    .on('log', log)
    .pipe(vinyl_src('symlar.js'))
    .pipe(vinyl_buffer())
    .pipe(dst('.')));

task('dev-test', ['dev-compile'], _ =>
    src(['test.js']).pipe(mocha({ require: 'mocha-clean', timeout: 60000, reporter: 'list' })));

task('watch', _ => watch(['lib/index.js'].concat(api).concat(['test.js']), ['dev-test']));


//----PROD-----

task('compile', ['lint'], _ =>
    browserify(brow_opts)
    .bundle()
    .on('error', err => log(err.message))
    .on('log', log)
    .pipe(vinyl_src('symlar.js'))
    .pipe(vinyl_buffer())
    .pipe(uglify())
    .pipe(dst('.')));

task('test', ['compile'], _ =>
    src(['test.js'])
    .pipe(mocha({ require: 'mocha-clean', timeout: 60000 })));

const doc_opts = {
    "tags":
    {
        "allowUnknownTags": true
    },
    "opts":
    {
        "destination": "./docs/",
        "template": "./node_modules/minami"
    },
    "plugins": [
        "plugins/markdown"
    ],

    "sourceType": "module",

    "templates":
    {
        "cleverLinks": false,
        "monospaceLinks": false,
        "navType": "vertical",
        "linenums": true,
        "dateFormat": "MMMM Do YYYY, h:mm:ss a"
    }
};

task('doc', ['test'], _ => src(['lib'], { read: false }).pipe(jsdoc(doc_opts)));
task('default', ['doc']);

task('just-doc', [], _ => src(['lib'], { read: false }).pipe(jsdoc(doc_opts)));