var redis = require('../redisSettings');

var data = ['abc', 'aaa', 'bbb'];
var user = 'ccc';

redis.setFriends(user, data);
redis.getFriends(user, function(result){console.log(result);});
redis.FLUSHDB();
redis.quit();
