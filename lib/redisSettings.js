var redis = require('redis');
var redisClient;

if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  redisClient = redis.createClient(rtg.port, rtg.hostname);
  redisClient.auth(rtg.auth.split(":")[1]);
} else {
  redisClient = redis.createClient();
}

exports.setFriends = function(user, friends){
    friends.forEach(function(friend){
        redisClient.sadd(user, friend, redis.print);
    });
};

exports.getFriends = function(user, callback) {
    redisClient.smembers(user, function(err, obj){
        callback(obj);
    }); 
};

exports.FLUSHDB = function(){
    redisClient.FLUSHDB(redis.print);
};

exports.quit = function() {
    redisClient.quit();
}
