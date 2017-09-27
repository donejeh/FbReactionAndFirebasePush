{

/* ========================
  Variables
======================== */

const FIREBASE_AUTH = firebase.auth();
const FIREBASE_MESSAGING = firebase.messaging();
const FIREBASE_DATABASE = firebase.database();

  const signInButton = $('#sign-in');
  const signOutButton = $('#sign-out');
  const subscribeButton = $('#subscribe');
  const unsubscribeButton = $('#unsubscribe');
  const statusPanel = $('#statusPanel');
  const sendNotificationForm = $('#send-notification-form');

/* ========================
  Event Listeners
======================== */

FIREBASE_AUTH.onAuthStateChanged(handleAuthStateChanged);
FIREBASE_MESSAGING.onTokenRefresh(handleTokenRefresh);

signInButton.on("click", signIn);
signOutButton.on("click", signOut);
subscribeButton.on("click", subscribeToNotifications);
unsubscribeButton.on("click", unsubscribeFromNotifications);
sendNotificationForm.on("submit", sendNotification);

/* ========================
  Functions
======================== */

function handleAuthStateChanged(user) {
  if (user) {
    // User is signed in
    console.log(user);
    signInButton.attr("hidden", "true");
    signOutButton.removeAttr("hidden");
    //sendNotificationForm.removeAttr("hidden");
    statusPanel.removeAttr("hidden");
    checkSubscription();
    fetchStatus();

  } else {
    // User is not signed in
    console.log("user is not signed in");
    signOutButton.attr("hidden", "true");
    signInButton.removeAttr("hidden");
    sendNotificationForm.attr("hidden", "true");
    unsubscribeButton.attr("hidden", "true");
    statusPanel.attr("hidden","true");
    subscribeButton.attr("hidden", "true");
  }
}

function signIn() {
  FIREBASE_AUTH.signInWithPopup(new firebase.auth.GoogleAuthProvider());
}

function signOut() {
  FIREBASE_AUTH.signOut();
}

function handleTokenRefresh() {
  return FIREBASE_MESSAGING.getToken().then((token) => {
    FIREBASE_DATABASE.ref('/tokens').push({
      token: token,
      uid: FIREBASE_AUTH.currentUser.uid
    });
  });
}

function checkSubscription() {
  FIREBASE_DATABASE.ref('/tokens').orderByChild("uid").equalTo(FIREBASE_AUTH.currentUser.uid).once('value').then((snapshot) => {
    if ( snapshot.val() ) {
      subscribeButton.attr("hidden", "true");
      unsubscribeButton.removeAttr("hidden");
      sendNotificationForm.removeAttr("hidden");
    } else {
      unsubscribeButton.attr("hidden", "true");
      subscribeButton.removeAttr("hidden");
      sendNotificationForm.attr("hidden", "true");
      
    }
  });
}

function subscribeToNotifications() {
  FIREBASE_MESSAGING.requestPermission()
    .then(() => handleTokenRefresh())
    .then(() => checkSubscription())
    .catch((err) => {
      console.log("error getting permission :(");
      
    });
}

function unsubscribeFromNotifications() {
  FIREBASE_MESSAGING.getToken()
    .then((token) => FIREBASE_MESSAGING.deleteToken(token))
    .then(() => FIREBASE_DATABASE.ref('/tokens/').orderByChild("uid").equalTo(FIREBASE_AUTH.currentUser.uid).once('value'))
    .then((snapshot) => {
      const key = Object.keys(snapshot.val())[0];
      return FIREBASE_DATABASE.ref('/tokens/').child(key).remove();
    })
    .then(() => checkSubscription())
    .catch((err) => {
      console.log("error deleting token :(");
    });
}

function sendNotification(e) {
  e.preventDefault();

  const notificationMessage = $('#notification-message').val();
  
  const t = Math.floor(Date.now() / 1000);
  if ( !notificationMessage ) return;

  FIREBASE_DATABASE.ref('/notifications/')
    .push({

      userProfileImg: FIREBASE_AUTH.currentUser.photoURL,
      stamp : t,
      user: FIREBASE_AUTH.currentUser.displayName,
      user_id : FIREBASE_AUTH.currentUser.uid,
      message: notificationMessage

    })
    .then(() => {
      $('#notification-message').val("");
    })
    .catch(() => {
      console.log("error sending notification :(")
    });
}

function fetchStatus(){
    
    FIREBASE_DATABASE.ref('/notifications/').orderByChild("stamp").on("child_added", function(snapshot){

       var name = snapshot.val().user;
       var pix = snapshot.val().userProfileImg;
       var mgs = snapshot.val().message;
       var stamp = snapshot.val().stamp;


      //try to format timestamp to date
      var postTime =  new Date (stamp*1000);
      var todate=new Date(postTime).getDate();
      var tomonth=new Date(postTime).getMonth()+1;
      var toyear=new Date(postTime).getFullYear();
      var original_date=tomonth+'/'+todate+'/'+toyear;
      var like; 

        var sat = "<hr><div style='width:auto;' class='demo-card-wide mdl-card mdl-shadow--2dp'><div class='mdl-card__title'><h2 class='mdl-card__title-text'>"+ name +"</h2></div><div style='background-color: rgb(0, 162, 249)' class='mdl-card__media'><img src='"+pix+"' width='50' height='50' class='img-responsive' alt='Image'></div><div class='mdl-card__supporting-text'>"+mgs+"</div> <div class='mdl-card__actions mdl-card--border'><span class='data_status'>"+original_date+"</span>";

      FIREBASE_DATABASE.ref('likes/').child(snapshot.key).once("value", function(snap){ 

          var count = snap.numChildren();
          var check = snap.hasChild(FIREBASE_AUTH.currentUser.uid);
          var likeName = snap.child(FIREBASE_AUTH.currentUser.uid).val();
          
            
             if (check && likeName !== null) {
                  sat +='<span class="countClass">Reaction'+count+'</span><a href="#" class="unLike" id="like'+snapshot.key+'" rel="unlike"><i class="'+likeName.toLowerCase().trim()+'IconSmall likeTypeSmall" ></i><span class="text-icon">'+likeName+'</span></a>';
             }else{
              sat += "<span class='countClass'>Reaction"+count+"</span><a href='#' class='reaction' id='like"+snapshot.key+"' rel='like'><i class='likeIconDefault' ></i></a></div>  <div class='mdl-card__menu'><button class='mdl-button mdl-button--icon mdl-js-button mdl-js-ripple-effect'><i class='material-icons'>share</i></button></div></div>";
             }
             $("#statusPanel").append(sat);

      $(".reaction").livequery(function () 
      {
        reactionsCode='<span post_key="'+snapshot.key+'" class="likeTypeAction" original-title="Like" data-reaction="1"><i class="likeIcon likeType"></i></span>'+
      '<span post_key="'+snapshot.key+'"  class="likeTypeAction" original-title="Love" data-reaction="2"><i class="loveIcon likeType"></i></span>'+
      '<span post_key="'+snapshot.key+'"  class="likeTypeAction" original-title="Haha" data-reaction="3"><i class="hahaIcon likeType"></i></span>'+
      '<span post_key="'+snapshot.key+'"  class="likeTypeAction" original-title="Wow" data-reaction="4"><i class="wowIcon likeType"></i></span>'+
      '<span post_key="'+snapshot.key+'"  class="likeTypeAction" original-title="Cool" data-reaction="5"><i class="coolIcon likeType"></i></span>'+
      '<span post_key="'+snapshot.key+'"  class="likeTypeAction" original-title="Confused" data-reaction="6"><i class="confusedIcon likeType"></i></span>'+
      '<span post_key="'+snapshot.key+'"  class="likeTypeAction" original-title="Sad" data-reaction="7"><i class="sadIcon likeType"></i></span>'+
      '<span post_key="'+snapshot.key+'"  class="likeTypeAction last" original-title="Angry" data-reaction="8"><i class="angryIcon likeType"></i></span>';

      $(this).tooltipster({
      contentAsHTML: true,
      interactive: true,
      content: $(reactionsCode),
      });
      });

         });

    
   }); 
    
}

}

