var path = require('path');
var through2 = require('through2');
var colors = require('gulp-util').colors;
var log = require('gulp-util').log;
var Moment = require('moment');
var Q = require('q');
var fs = require('fs');
var util = require('util');
var crypto = require('crypto');
var existFiles = 0;
var uploadedFiles = 0;
var uploadedFail = 0;
var qcloud = require('qcloud_cos');

module.exports = function(cloud, option) {
    option = option || {};
    option = Object.assign({}, { dir: '', versioning: false, versionFile: null, prefix: '' }, option);
    var version = Moment().format('YYMMDDHHmm'),
        tasks = [];

    return through2.obj(function(file, enc, next) {
        var that = this;
        if (file._contents === null) return next();

        var filePath = path.relative(file.base, file.path);
        var fileKey = option.dir + ((!option.dir || option.dir[option.dir.length - 1]) === '/' ? '' : '/') + (option.versioning ? version + '/' : '') + filePath.split(path.sep).join('/');
        var prefixFileKey = option.prefix + fileKey;
        qcloud.conf.setAppInfo(cloud.appid, cloud.secretId, cloud.accessId);
        var handler = function() {
            var defer = Q.defer();
            qcloud.cos.statFile(cloud.bucket, prefixFileKey, function(ret) {
                if (ret.code === 0) {
                    existFiles++;
                    return defer.resolve();
                }
                uploadedFiles++;
                qcloud.cos.upload(fileKey, cloud.bucket, prefixFileKey, 1, function(ret) {
                    log('Start →', colors.green(prefixFileKey), '→', ret.message);
                    if (ret.code != 0) {
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
