var path = require('path');
var jsonfile = require('jsonfile');
var through2 = require('through2');
var colors = require('gulp-util').colors;
var PluginError = require('gulp-util').PluginError;
var log = require('gulp-util').log;
var Q = require('q');
var fs = require('fs');
var qcloud = require('qcloud_cos');

var QCLOUD_JSON_PATH = path.join(process.cwd(), '.qcloud.json');
var qcloudJson = fs.existsSync(QCLOUD_JSON_PATH);
var obj = {创建缓存文件: true};
var PLUGIN_NAME = 'gulp-qcloud';

if(!qcloudJson){
    jsonfile.writeFileSync(QCLOUD_JSON_PATH, obj, {spaces: 2});
}
var qcloudJsonMap = require(QCLOUD_JSON_PATH);

var existFiles = Object.keys(qcloudJsonMap).filter(function (key) {
    return qcloudJsonMap[key] === true;
}).length - 1;

module.exports = function(cloud, option) {
    option = option || {};
    option = Object.assign({}, { dir: '', prefix: ''}, option);
    var tasks = [];
    var retry = [];

    var timeout = cloud.timeout || 30;
    qcloud.conf.setAppInfo(cloud.appid, cloud.secretId, cloud.accessId, timeout);

    var handler = function (filePath) {
        var fileKey = option.dir + ((!option.dir || option.dir[option.dir.length - 1]) === '/' ? '' : '/') + filePath.split(path.sep).join('/');
        var prefixFileKey = (option.prefix) === '' ? fileKey : (option.prefix + (option.prefix[option.prefix.length - 1] === '/' ? '' : '/') + filePath.split(path.sep).join('/'));

        var defer = Q.defer();

        // 文件在缓存文件中上传成功
        if(qcloudJsonMap[prefixFileKey] === true){
            return defer.resolve();
        }

        //保存未缓存文件
        qcloudJsonMap[prefixFileKey] = 'UNSOLVED';

        //文件在缓存文件中不存在，再到远程判断是否存在 也是为了新使用时创建缓存文件
        qcloud.cos.statFile(cloud.bucket, prefixFileKey, function(ret) {
            // 如果文件存在且上传完毕，不再重复上传
            if (ret.code === 0 && ret.data.filesize === ret.data.filelen) {
                qcloudJsonMap[prefixFileKey] = true;
                return defer.resolve();
            }
            qcloud.cos.upload(fileKey, cloud.bucket, prefixFileKey, 1, function(ret) {
                log('Start →', colors.green(prefixFileKey), '→', ret.message);
                if (ret.code !== 0) {
                    qcloudJsonMap[prefixFileKey] = false;
                    log('Error →', colors.red(prefixFileKey), ret.message);
                    return defer.reject(filePath);
                }
                qcloudJsonMap[prefixFileKey] = true;
                defer.resolve();
            });
        });
        return defer.promise;
    };

    // 处理完毕
    var done = function () {
        //由于不在缓存文件中，添加到缓存文件中
        jsonfile.writeFileSync(QCLOUD_JSON_PATH, qcloudJsonMap, {spaces: 2});

        log('共处理:', colors.green(Object.keys(qcloudJsonMap).length - 1),
            '跳过:', colors.gray(existFiles),
            '上传:', colors.green(Object.keys(qcloudJsonMap).filter(function (key) { return qcloudJsonMap[key] === true }).length - 1 - existFiles),
            '失败:', colors.red(Object.keys(qcloudJsonMap).filter(function (key) { return qcloudJsonMap[key] === false }).length));
    }

    return through2.obj(function (file, enc, next) {
        if (file._contents === null) {return next();}

        var filePath = path.relative(file.base, file.path);
        tasks.push(handler(filePath));
        next();
    }, function(cb) {
        Q.allSettled(tasks)
        .then(function(results) {
            results.forEach(function (result) {
                if (result.state === 'rejected') {
                    retry.push(handler(result.reason));
                }
            });
            // 不需要重试
            if (!retry.length) {
                done();
                return cb();
            }
            // 需要重试
            log(colors.green('重试: '));
            Q.allSettled(retry)
            .then(function(retries) {
                done();
                if (retries.every(function (retried) { return retried.state === 'fullfilled'; })) {
                    return cb();
                }
                return cb(new PluginError(PLUGIN_NAME, 'upload failed'));
            });
        });
    });
};
