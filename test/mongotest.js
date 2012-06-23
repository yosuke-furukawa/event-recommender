var mongo = require('../mongoSettings');

var data = [];
data.push(
    {id:123,screen_name:'test1',profile_image_url:'http://test.com'});
data.push(
    {id:124,screen_name:'test2',profile_image_url:'http://test.com'});
data.push(
    {id:125,screen_name:'test3',profile_image_url:'http://test.com'});


mongo.storeTwitter(data);


mongo.getNotExistsIds([123,124,125,126], function(result){
    console.log(result);
});

