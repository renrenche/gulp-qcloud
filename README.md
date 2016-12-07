# 上传文件到腾讯云

## Contribute

1. 克隆代码；

```
git clone git@gitlab.renrenche.com/fe/gulp-qcloud.git

```

2. 准备环境

执行

```
npm install
```
3.代码演示

```
在自己的gulp文件添加下面代码
const qcloud = require('qcloud')

gulp.task('qcloud', function () {
     return gulp.src('dist/**/*')
        .pipe(qcloud({
             accessId: 'NNZmFITjwo2swaUeLmdIgU3k6WbsWRLH',
            secretId: 'AKID69OLbTghCw0I9JTNWZVfWESqndrjCPba',
             bucket: 'webfe',
             appid: 10047826,
             timeout:10
         }, { dir: 'dist/',prefix: 'prefix'}));
});

其中('dist/**/*')为所要上传的路径，
{ dir: 'dist/',prefix: 'prefix'}为配置路径
dir为必添项 它代表到本地上传文件的路径 填写上传文件夹的名称 比如此项目上传dist下所有文件 所以dir:'dist/' 如果你想上传'public/js/**/*' 那么dir:'public/js/'
prefix为可选项 它代表你要上传到远端的路径 如果不填写的话 会默认dir的路径 如果填写了 访问prefix路径下文件就可以
dir prefix 下的 '/' 可以省略
timeout为超时时间 可以不设置 默认30s 
```

4.检测
```
s0.rrcimg.com/dist/heat.png
s1.rrcimg.com/dist/heat.png
```