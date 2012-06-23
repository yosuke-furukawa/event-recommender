var events = require('../events').events;
console.log('seminar');

events.getAttendUser('yosuke_furukawa', 'zusaar', 312053, function(results){
    console.log(results);
});

events.getAttendUser('yosuke_furukawa', 'atnd', 30029, function(results){
    console.log(results);
});
