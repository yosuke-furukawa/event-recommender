var async = require('async');
var _ = require('underscore');
var httpInfo = require('./httpInfo.js').httpInfo;
var EventEmitter = require('events').EventEmitter;
var COUNT = 40;
var months = 4;

var eventURLs = 
    ['http://api.atnd.org/events/', 'http://connpass.com/api/v1/event/','http://www.zusaar.com/api/event/','http://api.atnd.org/eventatnd/event/'];

var eventAttendURLs =
        {atnd: 'http://api.atnd.org/events/users/',
        zusaar: 'http://www.zusaar.com/api/event/user/'};

function SeminarInfo(){
}
SeminarInfo.prototype = new EventEmitter();

function isAfter(dateString) {
    var currentDate = new Date();
    var date = new Date(dateString);
    

    return currentDate.valueOf() < date.valueOf();
}

function dateQuery(date) {
    var currentYearMonth = date.getFullYear() + ('00' + (date.getMonth() + 1)).slice(-2);
    var calMonth = parseInt(currentYearMonth, 10);
    var calQuery = '';
    var i;
    for (i=0; i<months; i++) {
        if (i < months - 1) {
            calQuery += calMonth + ',';
        } else {
            calQuery += calMonth;
        }
        calMonth++;
        if (calMonth % 100 == 13) {
            calMonth += 100;
            calMonth -= 12;
        }
    }
    var querykey = 'ym';
    querykey = querykey + '=' + calQuery;
    return querykey;
}
    
function nicknameQuery(followers) {
    var followerQuery = '';

    followers.forEach(function(follower) {
        followerQuery += follower + ',';
    });
    followerQuery = followerQuery.substring(0, followerQuery.lastIndexOf(','));
    return followerQuery;
}

function isJson(data) {
    try {
        JSON.parse(data);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
}

SeminarInfo.prototype = new EventEmitter();

SeminarInfo.prototype.createQuery = function(date, followers) {
    var dq = dateQuery(date);
    var nq = nicknameQuery(followers);
    return nq + "&" + dq;
};

SeminarInfo.prototype.getEvent = function(query, callback) {
    var format = "format=json";
    var count = "count=100";
    
    var self = this;
    async.map(eventURLs, function(eventURL, mapCallback) {
        var namekey = 'nickname';

        if (eventURL.indexOf('atnd') >= 0) {
            namekey = 'twitter_id';
        }
        var url = eventURL+'?'+ namekey + '=' + query+'&'+format+'&'+count;
        //self.emit('request', url, mapCallback);
        httpInfo.emit('request', url, function(httpError, data){
            if (!httpError) {
                if (data && isJson(data)) {
                    var json = JSON.parse(data);
                    var events = json.events;
                    if (!events) {
                        events = json.event;
                    }
                    mapCallback(null, events);
                }
            } else {
                mapCallback(httpError, null);
            }
        });
    }, function(err, results){
        var arr = _.flatten(results);
        var resultsArr = [];
        arr.forEach(function(result){
            if (result) {
                resultsArr.push(result);
            }
        });
        callback(resultsArr);
    });
};

SeminarInfo.prototype.execute = function(users, callback) {
    var sliceNum = Math.ceil((users.length-1) / COUNT);
    var index;
    var self = this;
    var usersArray = [];
    for (index=0; index < sliceNum; index++) {
            var sliceIndex = index * COUNT;
            var sliceArray = users.slice(sliceIndex, sliceIndex + COUNT);
            usersArray.push(sliceArray);
    }
    async.map(usersArray, function(users, mapCallback) {
        var query = self.createQuery(new Date(), users);
        var result = [];
        self.getEvent(query, function(events){
            mapCallback(null, events);
        });
    }, function(err, results) {
        var flatArr = _.flatten(results);
        var events = [];
        if (flatArr) {
            results.forEach(function(result){
                result.forEach(function(item){
                    if (item.event_url) {
                        if(isAfter(item.ended_at)) {
                            events.push(item);
                        }
                    } else {
                        if (item.event) {
                            item.event.forEach(function(e) {
                                if(e.event_url){
                                    if(isAfter(e.ended_at)) {
                                    events.push(e);
                                    }
                                }
                            });
                        }
                    }
                });
            });
        }
        callback(events);
    });

};


SeminarInfo.prototype.getAttendance = function(category, eventId, callback) {
    var event_id = 'event_id';
    var format = "format=json";
    var eventurl =  eventAttendURLs[category];
    if (eventurl) {
        var url = eventurl + '?' + event_id + '=' + eventId + '&' + format;
    
        httpInfo.emit('request', url, function(httpError, data) {
            if (!httpError) {
                if (data && isJson(data)) {
                    var json = JSON.parse(data);
                    callback(json);
                }
            } else {
                console.log(httpError);
            }
        });
    }

};

var seminarInfo = new SeminarInfo();

seminarInfo.on('request', function(url, callback) {
    httpInfo.emit('request', url, function(httpError, data){
        if (data && isJson(data)) {
            var json = JSON.parse(data);
            var events = json.events;
            if (events && events.length > 0) {
                events.forEach(function(event){
                    callback(event);
                });
            }
        }
    });
});

exports.dateQuery = dateQuery; 
exports.nicknameQuery = nicknameQuery;
exports.SeminarInfo = seminarInfo;
