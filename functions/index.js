const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);


exports.sendNotifications = functions.database.ref('notifications/{notificationId}').onWrite((event) => {

  // Exit if data already created
  if (event.data.previous.val()) {
    return;
  }

  // Exit when the data is deleted
  if (!event.data.exists()) {
    return;
  }

  // Setup notification
  const NOTIFICATION_SNAPSHOT = event.data;
  const payload = {
    notification: {
      title: `New Message from ${NOTIFICATION_SNAPSHOT.val().user}!`,
      body: NOTIFICATION_SNAPSHOT.val().message,
      icon: NOTIFICATION_SNAPSHOT.val().userProfileImg,
      click_action: `https://${functions.config().firebase.authDomain}`
    }
  }

  // Clean invalid tokens
  function cleanInvalidTokens(tokensWithKey, results) {

    const invalidTokens = [];

    results.forEach((result, i) => {
      if ( !result.error ) return;

      console.error('Failure sending notification to', tokensWithKey[i].token, result.error);
      
      switch(result.error.code) {
        case "messaging/invalid-registration-token":
        case "messaging/registration-token-not-registered":
          invalidTokens.push( admin.database().ref('tokens').child(tokensWithKey[i].key).remove() );
          break;
        default:
          break;
      }
    });

    return Promise.all(invalidTokens);
  }


  return admin.database().ref('tokens').once('value').then((data) => {
    
    if ( !data.val() ) return;

    const snapshot = data.val();
    const tokensWithKey = [];
    const tokens = [];

    for (let key in snapshot) {
      tokens.push( snapshot[key].token );
      tokensWithKey.push({
        token: snapshot[key].token,
        key: key
      });
    }

    return admin.messaging().sendToDevice(tokens, payload)
      .then((response) => cleanInvalidTokens(tokensWithKey, response.results))
       .then(() => admin.database().ref('notifications').child(NOTIFICATION_SNAPSHOT.key).remove())
  });


});


//like function
exports.sendLikeNotifications = functions.database.ref('likes/{id}').onWrite((event) => {

  // Exit if data already created
  if (event.data.previous.val()) {
    return;
  }

  // Exit when the data is deleted
  if (!event.data.exists()) {
    return;
  }

      //getting like
      const NOTIFICATION_SNAPSHOT = event.data; 

     const fromUser = admin.database().ref(`/notifications/${NOTIFICATION_SNAPSHOT.key}`).once('value');
    return fromUser.then(fromUserResult => {

    const user_id = fromUserResult.val().user_id;
    const mgs = fromUserResult.val().message;
    const name = fromUserResult.val().user;

    return admin.database().ref(`/tokens/`).orderByChild("uid").equalTo(user_id).once('value').then((snapshot) => {

      const key = Object.keys(snapshot.val())[0];

      const getToken = admin.database().ref(`/tokens/${key}`).once('value');
       return getToken.then(result => {

        const token = result.val().token;

        // Set the message as high priority and have it expire after 24 hours.
        var options = {
        priority: "high",
        timeToLive: 60*60
        };

      const payload ={
      notification: {
      title: ` Reaction On Your Status !`,
      body: mgs,
      icon: "default",
      click_action: `https:${functions.config().firebase.authDomain}`
  }
};  

    // Send a message to devices subscribed to the provided topic.
    admin.messaging().sendToDevice(token, payload,options).then(() => admin.database().ref('likes').child(NOTIFICATION_SNAPSHOT.key).remove()).then(function(response) {
    // See the MessagingTopicResponse reference documentation for the
    // contents of response.
        console.log("Successfully sent message:", response);
      })
      .catch(function(error) {
        console.log("Error sending message:", error);
      });

});
});


 });


});
