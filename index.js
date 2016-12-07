var path = require('path');
var jsonfile = require('jsonfile');
var through2 = require('through2');
var colors = require('gulp-util').colors;
var log = require('gulp-util').log;
var Q = require('q');
var fs = require('fs');
var qcloud = require('qcloud_cos');
var existFiles = 0;
var uploadedFiles = 0;
var uploadedFail = 0;

var qcloudJson = fs.existsSync('.qcloud.json');
var obj = {'创建缓存文件': true};
if(!qcloudJson){
    jsonfile.writeFileSync('.qcloud.json', obj, {spaces: 4});
}
var qcloudMapJson = require('../../.qcloud.json');

module.exports = function(cloud, option) {
    option = option || {};
    option = Object.assign({}, { dir: '', prefix: ''}, option);
    var tasks = [];

    var timeout = cloud.timeout || 30;
    qcloud.conf.setAppInfo(cloud.appid, cloud.secretId, cloud.accessId, timeout);

    return through2.obj(function(file, enc, next) {
        if (file._contents === null) {return next();}

        var filePath = path.relative(file.base, file.path);
        var fileKey = option.dir + ((!option.dir || option.dir[option.dir.length - 1]) === '/' ? '' : '/') + filePath.split(path.sep).join('/');
        var prefixFileKey = (option.prefix) === '' ? fileKey : (option.prefix + ((!option.prefix || option.prefix[option.prefix.length - 1]) === '/' ? '' : '/') + filePath.split(path.sep).join('/'));

        var handler = function() {
            var defer = Q.defer();

            //文件在缓存文件中存在
            if(qcloudMapJson[prefixFileKey]){
                existFiles++;
                return defer.resolve();
            }

            //保存未缓存文件
            qcloudMapJson[prefixFileKey] = true;

            //文件在缓存文件中不存在，再到远程判断是否存在 也是为了新使用时创建缓存文件
            qcloud.cos.statFile(cloud.bucket, prefixFileKey, function(ret) {
                //由于不在缓存文件中，添加到缓存文件中
                jsonfile.writeFileSync('.qcloud.json', qcloudMapJson, {spaces: 4});
                if (ret.code === 0) {
                    existFiles++;
                    return defer.resolve();
                }
                uploadedFiles++;
                qcloud.cos.upload(fileKey, cloud.bucket, prefixFileKey, 1, function(ret) {
                    log('Start →', colors.green(prefixFileKey), '→', ret.message);
                    if (ret.code !== 0) {
                        uploadedFail++;
                        log('Error →', colors.red(prefixFileKey), ret.message);
                        defer.reject();
                    }
                    defer.resolve();
                });
            });
            return defer.promise;
        };
        tasks.push(handler());
        next();
    }, function() {
        Q.allSettled(tasks)
            .then(function(fulfilled) {
                log('共处理:', colors.green(fulfilled.length),
                    '跳过:', colors.gray(existFiles),
                    '上传:', colors.green(uploadedFiles - uploadedFail),
                    '失败:', colors.red(uploadedFail));
            }, function(err) {
                log('Failed upload files:', err.message);
            });
    });
};
