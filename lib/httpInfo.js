var request = require('request');
var qs = require('querystring');
var EventEmitter = require('events').EventEmitter;

function HttpInfo(){}
HttpInfo.prototype = new EventEmitter();
var httpInfo = new HttpInfo();

httpInfo.on('request', function(urlPath, callback){
    request({uri: urlPath}, function(err, res, body){
        console.log(urlPath);
        var error;
        if (err) {
            error = err;
        }
        if (res && res.statusCode !== 200) {
            error = new Error(body);
        }
        console.log(error);
        callback(error, body);
    });
});

exports.httpInfo = httpInfo;

