//Event 参加者取得APIをサポートしているかどうか
function isSupportEventApi(url) {
    return url.indexOf('atnd.org/event/') < 0 && url.indexOf('connpass') < 0;
}

function escapeHTML( text ) {
    var replacement = function( ch ) {
        var characterReference = {
            '"':'&quot;',
            '&':'&amp;',
            '\'':'&#39;',
            '<':'&lt;',
            '>':'&gt;'
        };
        return characterReference[ ch ];
    }
    return text.replace( /["&'<>]/g, replacement );
}

function searchEvent() {
var value = $("#twitter_id").val();
$("#progress-ctl").attr("class","progress progress-striped active");

$("#progress-bar").attr({
   class:"bar",
   style:"width:50%"
});
$("#search-button").attr('disabled','disabled');
$("#event-list").html('<h1>'+ value +'さんのfriendが参加しているイベント一覧</h1>');
$.ajax({
      type: "GET",
      url: "/events.json",
      data: {twitter_id: value},
      async: true,
      dataType: "json",
      cache: false,
      contentType: "application/json",
      error: function() {
        var warning = '<div class="alert alert-error"><button class="close" data-dismiss="alert">×</button>'+ '予期しないエラーが発生しました。' +'</div>';
         $("#result").html(warning);
        $("#search-button").removeAttr("disabled");
        $("#progress-ctl").attr("class","progress progress-danger progress-striped");
        $("#progress-bar").attr("style","width:100%"); 
      },
      success: function(data){
          $("#search-button").removeAttr("disabled");
          if (!data.error) {
          $("#twitter_id").val('');
          $("#result").html('');
          var index = 0;
          var titles = '';
          var topevents = data.slice(0, 3);
          var rankingIndex = 0;
          var twitter_message = value + 'さんにオススメのイベントは ';
          for (rankingIndex=0; rankingIndex<topevents.length; rankingIndex++) {
              var toptitle = (rankingIndex+1) + '位 ' +  topevents[rankingIndex].title + ' ';
              twitter_message += toptitle;
          }
          twitter_message += 'です。' + 'http://bit.ly/MEdFo2';
          
          $("#tweet_intent").html('<a href="https://twitter.com/intent/tweet?text=' + escapeHTML(twitter_message) + '"> <button class="btn">結果をTweetする</button></a>');

          for (index = 0; index < data.length; index++) {
              $("#progress-bar").attr("style","width:90%");
              var date = new Date(data[index].started_at);
              var dateStr = date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate();
              var titleHeader = '<div class="page-header"><h3>'+ dateStr + '  ' + data[index].title+'</h3></div>';
              var catchStr = '<p>' + data[index].catch + '</p>';
              var urlStr = '<a href="' + data[index].event_url +'" target="_blank">' + data[index].event_url +'</a>';
              var attending = '<div id=' + data[index].event_id + '></div>';
              $("#result").append(titleHeader + catchStr + urlStr + attending);
              if (isSupportEventApi(data[index].event_url)) {
              $.ajax({
                url: "/event/users.json",
                data: {twitter_id: value, event_id: data[index].event_id, event_category: data[index].event_category},
                asyc: true,
                dataType: "json",
                cache: false,
                contentType: "application/json",
                success: function(attend){
                    var attendIndex = 0;
                    if (attend.results.length) {
                    for (attendIndex = 0; attendIndex < attend.results.length; attendIndex++) {
                        $('#'+attend.event_id).append('<a href="https://twitter.com/#!/' + attend.results[attendIndex].screen_name + '" target="_blank"><img width=48px height=48px src='+attend.results[attendIndex].photo+' /></a>');
                    }
                    }
                    
                }
              });
              }
          }
          $("#progress-ctl").attr("class","progress progress-striped");
          $("#progress-bar").attr("style","width:100%");
          } else {
              var error = data.error;
              var errorJson;
              var warning;
              try {
                  errorJson = JSON.parse(error);
              } catch(e) {
              }
              if (errorJson) {
                var errors = errorJson.errors;
                var msg;
                if (errors && errors.length > 0) {
                    msg = errors[0].message;
                } else {
                    msg = errorJson.error;
                }
                warning = '<div class="alert alert-error"><button class="close" data-dismiss="alert">×</button>'+msg+'</div>';
              } else {
                  warning = '<div class="alert alert-error"><button class="close" data-dismiss="alert">×</button>'+ '予期しないエラーが発生しました。' +'</div>';

              }
              $("#result").html(warning);
              $("#search-button").removeAttr("disabled");
              $("#progress-ctl").attr("class","progress progress-danger progress-striped");
              $("#progress-bar").attr("style","width:100%"); 
          }
      }
    });
    
$('form').submit(function() {
    return false;
});

}
