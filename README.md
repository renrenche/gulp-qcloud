# gulp-qcloud

Upload files to QCloud

## Usage

```
const qcloud = require('gulp-qcloud')

gulp.task('qcloud', function () {
     return gulp.src('dist/**/*')
        .pipe(qcloud({
            accessId: 'Your access ID',
            secretId: 'Your secret ID',
            bucket: 'Your bucket name',
            appid: 123456 // APP ID
        }, {
            dir: 'dist/',
            prefix: 'prefix'
        }));
});
```
