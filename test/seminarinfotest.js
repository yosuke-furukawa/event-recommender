var seminarInfo = require('../seminarInfo').SeminarInfo;
console.log('seminar');

seminarInfo.getAttendance('atnd', 30029, function(results){
    console.log('test');
    console.log(results);
    var event = results.events;
    if (!event){
        event = results.event;
    }

    event.forEach(function(item){
        item.users.forEach(function(user){
            console.log(user);
        });
    });
});
                          
seminarInfo.getAttendance('zusaar', 312053, function(results){
    console.log('test');
    console.log(results);
    var event = results.events;
    if (!event){
        event = results.event;
    }
    event.forEach(function(item){
        item.users.forEach(function(user){
            console.log(user);
        });
    });
});
