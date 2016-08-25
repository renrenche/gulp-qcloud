* const qcloud = require('qcloud')

* gulp.task('qcloud', function () {
*     return gulp.src('dist/**/*')
*        .pipe(qcloud({
*             accessId: 'NNZmFITjwo2swaUeLmdIgU3k6WbsWRLH',
*            secretId: 'AKID69OLbTghCw0I9JTNWZVfWESqndrjCPba',
*             bucket: 'webfe',
*             appid: 10047826
*         }, { dir: 'dist/'}));
* });