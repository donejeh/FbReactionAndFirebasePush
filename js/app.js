$(document).ready(function()
{

/* ========================
  Variables
======================== */

const FIREBASE_AUTH = firebase.auth();
const FIREBASE_MESSAGING = firebase.messaging();
const FIREBASE_DATABASE = firebase.database();

$(".likeTypeAction").tipsy({gravity: 's',live: true});

        /*Reaction*/
      $("body").on("click",".likeTypeAction",function(e)
      {
        e.preventDefault();

      var reactionType=$(this).attr("data-reaction");
      var reactionName=$(this).attr("original-title");
      var rel=$(this).parent().parent().attr("rel");
      var postKey=$(this).attr("post_key");
      var x=$(this).parent().parent().attr("id");
      var sid=x.split("reaction");
      var msg_id=sid[1];

      var htmlData='<i class="'+reactionName.toLowerCase()+'IconSmall likeTypeSmall" ></i>'+reactionName;
    var dataString = 'msg_id='+ msg_id +'&rid='+reactionType;

  FIREBASE_DATABASE.ref('/likes/')
    .child(postKey).set({
      [FIREBASE_AUTH.currentUser.uid]: reactionName
    })
    .then(() => {
      $("#like"+msg_id).html(htmlData).removeClass('reaction').removeClass('tooltipstered').addClass('unLike').attr('rel','unlike');
      $("#"+x).hide();

    })
    .catch(() => {
      console.log("Unable to like post :(")
    });
  

return false;
});
    // for unliking status	
		$("body").on("click",".unLike",function()
		{
		var reactionType='1';
		var x=$(this).attr("id");
		var sid=x.split("like");
		var msg_id=sid[1];
		var dataString = 'msg_id='+ msg_id +'&rid='+reactionType;
		var htmlData='<i class="likeIconDefault" ></i></a>';

		    FIREBASE_DATABASE.ref('/likes/')
		    .child(msg_id).remove()
		    .then(() => {
		      $("#like"+msg_id).html(htmlData).addClass('reaction').addClass('tooltipstered').removeClass('unLike');
		    })
		    .catch(() => {
		      console.log("Unable to like post :(")
		    });

		return false;
		});


	
});