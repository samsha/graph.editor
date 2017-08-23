var gulp = require('gulp');

var usemin = require('gulp-usemin');
var uglify = require('gulp-uglify');
var minifyHtml = require('gulp-minify-html');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');
var del = require('del');

var out = 'dist';
gulp.task('clean', function(cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del([out], cb);
});
gulp.task('copyfiles', function() {
    gulp.src('app/libs/**/*.*')
        .pipe(gulp.dest(out + '/libs'));
    gulp.src('app/images/**/*.*')
        .pipe(gulp.dest(out + '/images'));
    gulp.src('app/data/**/*.*')
        .pipe(gulp.dest(out + '/data'));
    gulp.src('app/src/css/**/*.*')
        .pipe(gulp.dest(out + '/libs/graph.editor/'));
    //gulp.src('./app/data/**/*.*')
    //    .pipe(gulp.dest(out + '/data'));
    //gulp.src('./app/images/**/*.*')
    //    .pipe(gulp.dest(out + '/images'));
});
gulp.task('usemin', function () {
    gulp.run('copyfiles');
    return gulp.src('./app/index.html')
        .pipe(usemin({
            // css: [minifyCss(), 'concat'],
            // html: [minifyHtml({empty: true})],
            // js: [uglify(), rev()]
            js: [uglify()]
        }))
        .pipe(gulp.dest(out));
});

gulp.task('default', ['usemin']);
