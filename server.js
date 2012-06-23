var eventInfo = require('./lib/events').events;
var port = process.env.PORT || 3000;
var app = require('./app').init(port);

var locals = {
        title:'イベントリコメンったー',
        description:'オススメのイベントを教えてくれるアプリ。',
        author:'Yosuke Furukawa'
    };

app.get('/', function(req,res){

    locals.date = new Date().toLocaleDateString();
    res.render('template.ejs', locals);
});

app.get('/events.json', function(req, res) {
    var twitter_id = '';
    if(req.query.twitter_id) {
        twitter_id = req.query.twitter_id;
    }
    console.log(twitter_id);
    if (twitter_id && twitter_id != '') {
        eventInfo.getEvent(twitter_id, function(err, data){
            if (!err) {
                res.contentType('application/json');
                res.json(data);
            } else {
                console.log('err = ' + err);
                res.contentType('application/json');
                res.json({error:err.message});
            }
        });    
    }
});

app.get('/event/users.json', function(req, res){
    if (req.query.twitter_id && req.query.event_id && req.query.event_category) {
        eventInfo.getAttendUser(req.query.twitter_id,
                                req.query.event_category,
                                req.query.event_id,
                                function(results){
                                    res.contentType('application/json');

                                   res.json(results); 
                                }
                               );
    }
});

/* The 404 Route (ALWAYS Keep this as the last route) */
app.get('/*', function(req, res){
    res.render('404.ejs', locals);
});

process.on('uncaughtException', function (err) {
    console.log('uncaughtException => ' + err);
});

