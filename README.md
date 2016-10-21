# gulp-qcloud

[![npm](https://img.shields.io/npm/v/gulp-qcloud.svg)](https://www.npmjs.com/package/gulp-qcloud)
[![license](https://img.shields.io/npm/l/gulp-qcloud.svg)](https://www.npmjs.com/package/gulp-qcloud)

Upload files to qcloud

## Installation

```js
npm install --save gulp-qcloud
```

## Usage

```js
const gulp = require('gulp')
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
