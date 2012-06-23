var async = require('async');
var _ = require('underscore');
var twitterInfo = require('./twitterInfo').TwitterInfo;
var seminarInfo = require('./seminarInfo').SeminarInfo;

var categoryArray = ['eventatnd', 'connpass', 'zusaar', 'atnd'];

function Events(){}

Events.prototype.getEvent = function(user, result_callback) {
async.waterfall([
    function getFriendUsers(callback) {
        twitterInfo.getFriendUserId(user, function(err, users){
            
            if (!err) {
            console.log(users);
            callback(null, users);
            } else {
                console.log('events err : ' + err);
                callback(err);
            }
        });
    },
    function getSeminarInfo(users) {
        seminarInfo.execute(users, function(events){
            var eventInfoTable = {};
            var eventArray = [];
            var COUNT_KEY = 'count';
            
            events.forEach(function(event){
                var count = eventInfoTable[event.title];
                if (count) {
                    eventInfoTable[event.title] = count + 1;
                } else {
                    eventInfoTable[event.title] = 1;
                    eventArray.push(event);
                }
            });
            var results = [];
            eventArray.forEach(function(event){
                event.count = eventInfoTable[event.title];
                categoryArray.forEach(function(category){
                    if (event.event_url.indexOf(category) >= 0) {
                        event.event_category = category;
                    }
                });
                results.push(event);
            });
            results.sort(function(event1, event2){
                return (event2.count - event1.count);
            });
            console.log(results);
            result_callback(null, results);
            
        });
    }
], function (err, result){
    if(err) {
        var message = err.message;
        var messageForUser = '';
        var error = err;
        if (message) {
            try {
                var msgJson = JSON.parse(message);
                console.log('ERROR MSG = ' + msgJson);
            } catch(e) {
                messageForUser = '予期しないエラーが発生しました。';
                error = new Error(messageForUser);
            }
        }
        result_callback(error, null);
    }
    return;
});
};

Events.prototype.getAttendUser = function(user, category, eventId, callback) {
    async.waterfall([
        function(waterfall_callback) {
            twitterInfo.getFriends(user, function(results){waterfall_callback(null, results);});
        },
        function(friends) {
            var attends = [];
            seminarInfo.getAttendance(category, eventId, function(results){
                var event = results.events;
                if (!event){
                   event = results.event;
                }
                event.forEach(function(item){
                    item.users.forEach(function(user){
                        var username = user.twitter_id;
                        if (!username) {
                            username = user.nickname;
                        }
                        attends.push(username);
                    });
                });
                var intersect = _.intersection(friends, attends);
                async.map(
                    intersect,
                    function(user, map_callback){
                        twitterInfo.getPhoto(user, function(result){
                            map_callback(null, result);
                        });
                    },
                    function(err, results) {
                        var userData = {};
                        userData.results = results;
                        userData.event_id = eventId;
                        console.log(userData);
                        callback(userData);
                    }
                );
            });
        }
    ]);
};

process.on('uncaughtException', function (err) {
    console.log('uncaughtException => ' + err);
});

var events = new Events();
exports.events = events;
//console.log(eventInfoTable);

