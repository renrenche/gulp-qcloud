var path = require('path');
var through2 = require('through2');
var colors = require('gulp-util').colors;
var log = require('gulp-util').log;
var Moment = require('moment');
var Q = require('q');
var fs = require('fs');
var util = require('util');
var crypto = require('crypto');
var uploadedFiles = 0;
var uploadedFail = 0;
var auth = require('./lib/auth.js');
var conf = require('./lib/conf.js');
var cos = require('./lib/cos.js');

module.exports = function (cloud, option) {
	option = option || {};
	option = extend({dir: '', versioning: false, versionFile: null}, option);

	var version = Moment().format('YYMMDDHHmm')
	, tasks = [];

	return through2.obj(function (file, enc, next) {
	    var that = this;
	    if (file._contents === null) return next();

	    var filePath = path.relative(file.base, file.path);
	    var fileKey = option.dir + ((!option.dir || option.dir[option.dir.length - 1]) === '/' ? '' : '/') + (option.versioning ? version + '/' : '') + filePath.split(path.sep).join('/');
	    conf.setAppInfo(cloud.appid,cloud.secretId,cloud.accessId);
	    var handler = function () {
	    	var defer = Q.defer();
	        cos.statFile(cloud.bucket, fileKey, function(ret) {
	           	if(ret.code === 0){
	           		return defer.resolve();
	           	}
	            uploadedFiles++;
				cos.upload(fileKey, cloud.bucket, fileKey, 1, function(ret) {
					log('Start →', colors.green(fileKey), '→', ret.message);
					if(ret.code != 0) {
						uploadedFail++;
						log('Error →', colors.red(fileKey), ret.message);
					}
					defer.resolve();
				});
	        });
	    	return defer.promise;
	    };
	    tasks.push(handler());
	    next();
	}, function () {
	    Q.allSettled(tasks)
	      .then(function (rets) {
	        log('Total:', colors.green(uploadedFiles + '/' + rets.length));
	        log('Failed:', colors.red(uploadedFail + '/' + uploadedFiles))
	      }, function (err) {
	        log('Failed upload files:', err.message);
	      });
	});

	function extend(target, source) {
		target = target || {};
		for (var prop in source) {
			if (typeof source[prop] === 'object') {
				target[prop] = extend(target[prop], source[prop]);
			} else {
				target[prop] = source[prop];
			}
		}
		return target;
	}
};
