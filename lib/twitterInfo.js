var async = require('async');
var httpInfo = require('./httpInfo').httpInfo;
var EventEmitter = require('events').EventEmitter;
var mongo = require('./mongoSettings');
var redis = require('./redisSettings');
var _ = require('underscore');
var COUNT = 100;
var MAX_COUNT = 1000;
var TWITTER_FRIEND_API_URL = 'http://api.twitter.com/1/friends/ids.json';
var TWITTER_USER_API_URL = 'http://api.twitter.com/1/users/lookup.json';
var TWITTER_STATUS_FRIEND_API_URL = 'http://api.twitter.com/1/statuses/friends.json';
var SCREEN_NAME_KEY = 'screen_name';
var USER_ID_KEY = 'user_id';
var INCLUDE_ENTITIES = 'include_entities=false';
var CURSOR = 'cursor=-1';

function TwitterInfo() {
}

TwitterInfo.prototype = new EventEmitter();

// Twitter APIを使って友人一覧を出します。
// 友人一覧は100件の制限があるので、100件ずつ問い合わせしてscreen_nameを持ってきます。
// 結果はmongoとredisに格納されます。
TwitterInfo.prototype.getFriendUserId = function(screen_name, callback) {
    var url = TWITTER_FRIEND_API_URL+'?'+SCREEN_NAME_KEY+'='+screen_name+'&'+INCLUDE_ENTITIES;
    httpInfo.emit('request', url, function(httpError, data){
        if (!httpError) {
            var json = JSON.parse(data);
            var allIds = json.ids;
            async.waterfall([
                            function(waterfall_callback){
                                mongo.getNotExistsIds(allIds, function(ids){
                                    waterfall_callback(null, ids);
                                });
                            },
                            function(ids, waterfall_callback){
                                var sliceNum = Math.ceil((ids.length-1) / COUNT);
                                var index;
                                var urls = [];
            
                                for (index=0; index < sliceNum; index++) {
                                    var sliceIndex = index * COUNT;
                                    var sliceArray = ids.slice(sliceIndex, sliceIndex + COUNT);
                                    var sliceString = '';
                                    sliceArray.forEach(function(id){
                                        sliceString += id + ',';
                                    });
                                    sliceString = sliceString.substring(0, sliceString.lastIndexOf(','));
                                    var infoUrl = TWITTER_USER_API_URL + '?' + USER_ID_KEY + '=' + sliceString;
                                    urls.push(infoUrl); 
                                }
                                if (urls.length > 0) {
                                async.map(urls, function(url, map_callback){
                                    httpInfo.emit('request', url, function(httpErrorInner, data){
                                        if (!httpError) {
                                            var userJson = JSON.parse(data);
                                            try {
                                                map_callback(null, userJson);
                                            } catch(e) {
                                                map_callback(e, null);
                                            }
                                        } else {
                                            map_callback(httpErrorInner, null);
                                        }
                                  });
                                }, function(err, results) {
                                    mongo.storeTwitter(results);
                                    console.log(results);
                                    
                                    var unstoredIds = [];
                                    results.forEach(function(result){
                                        if (result) {
                                            unstoredIds.push(result.id);
                                        }
                                    });
                                    
                                    var storedIds = _.difference(allIds, unstoredIds);

                                    var usersResult = { 
                                        unstoredUsers: results[0],
                                        storedIds: storedIds
                                    }
                                    console.log(usersResult);
                                    waterfall_callback(null, usersResult);
                                });
                                } else {
                                    var usersResult = { 
                                        unstoredUsers: [],
                                        storedIds: allIds
                                    }
                                    console.log(usersResult);
                                    waterfall_callback(null, usersResult);

                                }
                            },
                            function(usersResult) {
                                var storedIds = usersResult.storedIds;
                                async.map(storedIds, function(id, map_callback){
                                    mongo.query({userid: id}, function(result){
                                        map_callback(null, result);
                                    });
                                }, function(err, result){
                                    var friends = [];
                                    result.forEach(function(friend){
                                        if(friend) {
                                            friends.push(friend.screen_name);
                                        }
                                    });
                                    var unstoredUsers = usersResult.unstoredUsers;
                                    unstoredUsers.forEach(function(user){
                                        console.log('unstored = ' + user.screen_name);
                                        if(user) {
                                            friends.push(user.screen_name);
                                        }
                                    });
                                    redis.setFriends(screen_name, friends);
                                    var limitedUsers = friends.slice(0, MAX_COUNT);
                                    callback(null, limitedUsers);
                                });
                            }
            ]);
        } else {
            redis.getFriends(screen_name, function(friends){
                if (friends && friends.length > 0) {
                    var limitedUsers = friends.slice(0, MAX_COUNT);
                    callback(null, limitedUsers);
                } else {
                    callback(httpError, null);
                }
            });
        }
    });
};

TwitterInfo.prototype.getFriends = function(user, callback) {
    redis.getFriends(user, callback);
};

TwitterInfo.prototype.getPhoto = function(user, callback) {
    mongo.query({screen_name:user}, function(result) {
        
        callback(result);
    });
};

var twitterInfo = new TwitterInfo();

twitterInfo.on('friendsInfo', function(followerJson) {
    
});

exports.TwitterInfo = twitterInfo;
