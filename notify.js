var gcm = require('node-gcm');
var message = new gcm.Message();
 
//API Server Key
var sender = new gcm.Sender('AIzaSyCcKBWFkLYNu-lsJ1lRHNfa0QLV_HTX2Qk');
var registrationIds = [];
 
// Value the payload data to send...
message.addData('message',"\u270C Peace, Love \u2764 and PhoneGap \u2706!");
message.addData('title','Push Notification Sample' );
message.addData('msgcnt','3'); // Shows up in the notification in the status bar
message.addData('soundname','beep.wav'); //Sound to play upon notification receipt - put in the www folder in app
//message.collapseKey = 'demo';
//message.delayWhileIdle = true; //Default is false
message.timeToLive = 3000;// Duration in seconds to hold in GCM and retry before timing out. Default 4 weeks (2,419,200 seconds) if not specified.
 
// At least one reg id required
registrationIds.push('APA91bEDW_lcmjr1K-sH9yLOPF-dg-IKtb06WzVEp2rmyE3O8vxCw8DYt01kOLHGTlqqmJsLlnAju9fWbxm3HyZ40fONzRK9D-lO3N_ckA3DjQY7vRem4Z_pFUeN4ZJYN9cgcPcyaMH0e6BIHiaW1ro-NYLhu3LD4A');
 
/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
sender.send(message, registrationIds, 4, function (result) {
    console.log(result);
});
