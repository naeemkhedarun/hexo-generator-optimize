var config = hexo.config.optimize;
var async  = require('async')
// hexo.public_dir
// hexo.base_dir;
// var desPathJs = hexo.public_dir+"js/final.js";
// var desPathCss = hexo.public_dir+"css/finalcss.css";

var gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	plugins = gulpLoadPlugins();
  
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

//build datestamp for cache busting
var getStamp = function() {
  var myDate = new Date();

  var myYear = myDate.getFullYear().toString();
  var myMonth = ('0' + (myDate.getMonth() + 1)).slice(-2);
  var myDay = ('0' + myDate.getDate()).slice(-2);
  var mySeconds = myDate.getSeconds().toString();

  var myFullDate = myYear + myMonth + myDay + mySeconds;

  return myFullDate;
};

// Optimize Images task
gulp.task('images', function() {
  return gulp.src(hexo.public_dir + '/images/*.{gif,jpg,png}')
    .pipe(plugins.imagemin({
        progressive: true,
        interlaced: true,
        svgoPlugins: [ {removeViewBox:false}, {removeUselessStrokeAndFill:false} ]
    }))
    .pipe(gulp.dest(hexo.public_dir + '/images/*.{gif,jpg,png}'))
});

gulp.task('css', function() {
  return gulp.src(hexo.public_dir + '/css/*.css')
    .pipe(plugins.plumber({ errorHandler: onError }))
    .pipe(plugins.concat('all.css'))
    .pipe(plugins.uncss({
        html: [hexo.public_dir + '/index.html']
    }))
    .pipe(plugins.autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(plugins.base64({ extensions:['svg'] }))
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.rev())
    .pipe(plugins.minifyCss())
    .pipe(gulp.dest(hexo.public_dir + '/css/'))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(hexo.public_dir + '/css/'))
    .pipe(plugins.notify({ message: 'Styles task complete' }));
});

gulp.task('js', function() {
  return gulp.src(hexo.public_dir + '/js/*.js')
    .pipe(plugins.plumber({ errorHandler: onError }))
    .pipe(plugins.concat('all.js'))
    .pipe(plugins.rename({ suffix: '.min' }))
    .pipe(plugins.uglify())
    .pipe(plugins.rev())
    .pipe(gulp.dest(hexo.public_dir + '/js/'))
    .pipe(plugins.rev.manifest())
    .pipe(gulp.dest(hexo.public_dir + '/js/'))
    .pipe(plugins.notify({ message: 'Styles task complete' }));
});

gulp.task('html', ["css", "js"],function() {
  var cssManifest = gulp.src(hexo.public_dir + 'css/rev-manifest.json');
  var jsManifest = gulp.src(hexo.public_dir + 'js/rev-manifest.json');
  return gulp.src(hexo.public_dir + '/**/*.html')
    .pipe(plugins.htmlReplace({css: 'css/all.min.css', js: 'js/all.min.js'}))
    .pipe(plugins.revReplace({manifest: cssManifest}))
    .pipe(plugins.revReplace({manifest: jsManifest}))
    .pipe(gulp.dest(hexo.public_dir));
});

// // Lint JS task
// gulp.task('jslint', function() {
//   return gulp.src('./public_html/assets/js/modules/*.js')
//     .pipe(plugins.jshint())
//     .pipe(plugins.jshint.reporter('default'))
//     .pipe(plugins.jshint.reporter('fail'))
//     .pipe(plugins.notify({ message: 'Lint task complete' }));
// });

// //Concatenate and Minify JS task
// gulp.task('scripts', function() {
//   return gulp.src('./public_html/assets/js/modules/*.js')
//     .pipe(concat('webstoemp.js'))
//     .pipe(gulp.dest('./public_html/assets/js/build'))
//     .pipe(plugins.rename('webstoemp.min.js'))
//     .pipe(plugins.stripdebug())
//     .pipe(plugins.uglify())
//     .pipe(gulp.dest('./public_html/assets/js/build'))
//     .pipe(plugins.notify({ message: 'Scripts task complete' }));
// });

// // Cache busting task
// gulp.task('cachebust', function() {
//   return gulp.src('./craft/templates/_layouts/*.html')
//     .pipe(plugins.replace(/screen.min.css\?([0-9]*)/g, 'screen.min.css?' + getStamp()))
//     .pipe(plugins.replace(/print.min.css\?([0-9]*)/g, 'print.min.css?' + getStamp()))
//     .pipe(plugins.replace(/webstoemp.min.js\?([0-9]*)/g, 'webstoemp.min.js?' + getStamp()))
//     .pipe(gulp.dest('./craft/templates/_layouts/'))
//     .pipe(plugins.notify({ message: 'CSS/JS Cachebust task complete' }));
// });

//tasks
// gulp.task('default', ['css', 'jslint', 'scripts', 'cachebust']);
gulp.task('default', ['css', 'js','html']);
// gulp.task('images', ['img']);

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
            util.error("[error] Minify: -> " + err.message);
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
