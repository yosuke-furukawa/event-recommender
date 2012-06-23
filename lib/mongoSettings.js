var mongoose = require('mongoose');
var async = require('async');

//mongo config
var mongoUri = process.env.MONGOHQ_URL || 'mongodb://localhost/twitterUser';
var Schema = mongoose.Schema;
var twitterSchema = new Schema({
    userid: {type:String, unique: true},
    screen_name: {type: String, unique: true},
    photo: String
});
mongoose.connect(mongoUri);

var TwitterModel = mongoose.model('twitter', twitterSchema);

function disconnect(){
    mongoose.disconnect();
}

exports.storeTwitter = function(dataArr) {
       //data.forEach(function(datum){
    dataArr.forEach(function(data){
    async.map(data, function(datum){
        
    TwitterModel.findOne({ userid: datum.id}, function(err, doc){
      if(!doc) {
          console.log('mongo ' + datum.screen_name);
        var twitterData = new TwitterModel();  
        twitterData.userid = datum.id;
        twitterData.screen_name = datum.screen_name;
        twitterData.photo = datum.profile_image_url;
        twitterData.save(function(err){});
        //callback(null, datum);
      } 
      //else {
      //    callback(null, null);
      //}
    });
    });
    });
};

exports.getNotExistsIds = function(userids, callback){
    //mongoose.connect(mongoUri);
    async.map(userids, function(userid, mapcallback){
        TwitterModel.findOne({userid: userid}, function(err, doc){
            if(!doc) {
                mapcallback(null, userid);
            } else {
                mapcallback(null, null);
            }
        });
    }, function(err, results){
        callback(results.filter(function(item){return item != null;}));
        //disconnect();
    });    
};

exports.query = function(query, callback) {
    //mongoose.connect(mongoUri);
    TwitterModel.findOne(query, function(err, doc) {
        if (doc) {
            console.log(doc);
            callback(doc);
        } else {
            callback(null);
        }
        //disconnect();
    });
};

