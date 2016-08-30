# 上传文件到腾讯云

## Contribute

1. 克隆代码；

```
git clone git@gitlab.renrenche.com/fe/gulp-qcloud.git
npm install

```

2.代码演示

```
在自己的gulp文件添加下面代码
const qcloud = require('qcloud')

gulp.task('qcloud', function () {
     return gulp.src('dist/**/*')
        .pipe(qcloud({
             accessId: 'NNZmFITjwo2swaUeLmdIgU3k6WbsWRLH',
            secretId: 'AKID69OLbTghCw0I9JTNWZVfWESqndrjCPba',
             bucket: 'webfe',
             appid: 10047826
         }, { dir: 'dist/'}));
});

其中('dist/**/*')所要上传的路径，{ dir: 'dist/'}为上传到腾讯云的路径
注意此时的dir路径一定要和所要上传的路径更目录相同（如果是上传dist下的文件 dir一定为dist）
不同的话腾讯云会找不见到要上传的文件路径
```

3.检测
```
s0.rrcimg.com/dist/heat.png
s1.rrcimg.com/dist/heat.png
```