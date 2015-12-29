var gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	plugins = gulpLoadPlugins(),
  async  = require('async');
  
var public_dir = hexo.public_dir;
var config = hexo.config.optimize;
  
// error function for plumber
var onError = function (err) {
  plugins.util.beep();
  console.log(err);
  this.emit('end');
};

// Browser definitions for autoprefixer
var AUTOPREFIXER_BROWSERS = [
  'last 3 versions',
  'ie >= 8',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

gulp.task('css', function() {
  return gulp.src(public_dir + '/css/*.css')
    .pipe(plugins.plumber({ errorHandler: onError }))
    .pipe(plugins.concat('all.css'))
    .pipe(plugins.uncss({
        html: [public_dir + '/index.html']
    }))
    .pipe(plugins.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(plugins.base64({ extensions:['svg'] }))
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.rev())
    .pipe(plugins.minifyCss())
    .pipe(gulp.dest(public_dir + config.css_filepath))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(public_dir + '/css/'))
    .pipe(plugins.notify({ message: 'Styles task complete' }));
});

gulp.task('js', function() {
  return gulp.src(public_dir + '/js/*.js')
    .pipe(plugins.plumber({ errorHandler: onError }))
    .pipe(plugins.concat('all.js'))
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.uglify())
    .pipe(plugins.rev())
    .pipe(gulp.dest(public_dir + config.js_filepath))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(public_dir + '/js/'))
    .pipe(plugins.notify({ message: 'Styles task complete' }));
});

gulp.task('html', ["css", "js"],function() {
  var cssManifest = gulp.src(public_dir + 'css/rev-manifest.json');
  var jsManifest = gulp.src(public_dir + 'js/rev-manifest.json');
  return gulp.src(public_dir + '/**/*.html')
    .pipe(plugins.htmlReplace({css: config.css_webpath + 'all.min.css', js: config.js_webpath + 'all.min.js'}))
    .pipe(plugins.revReplace({manifest: cssManifest}))
    .pipe(plugins.revReplace({manifest: jsManifest}))
    .pipe(plugins.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(public_dir));
});

gulp.task('default', ['css', 'js','html']);

var optimize = function(args) {
    async.series([
        function(callback) {
            hexo.call("generate", callback)
        },
        function(callback) {
            gulp.start();
            callback(null,null)
        },
        function( callback) {
            if(args.d == true) {
              hexo.call("deploy" , callback);
            }
        },
    ], function(err){
        if (err) {
            plugins.util.error("[error] Minify: -> " + err.message);
        }
    });
};

// Plugin hook function.
hexo.extend.console.register('optimize', 'Hexo Generator Optimize', function(args) {
    optimize(args);
});
hexo.extend.console.register('o', 'Hexo Generator Optimize', function(args) {
    optimize(args);
});
hexo.extend.console.register('od', 'Hexo Generator Optimize', function(args) {
    args.d = true;
    optimize(args);
});
