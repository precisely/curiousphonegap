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
registrationIds.push('APA91bwu-47V0L7xB55zoVd47zOJahUgBFFuxDiUBjLAUdpuWwEcLd3FvbcNTPKTSnDZwjN384qTyfWW2KAJJW7ArZ-QVPExnxWK91Pc-uTzFdFaJ3URK470WmTl5R1zL0Vloru1B-AfHO6QFFg47O4Cnv6yBOWEFcvZlHDBY8YaDc4UeKUe7ao');
 
/**
 * Parameters: message-literal, registrationIds-array, No. of retries, callback-function
 */
sender.send(message, registrationIds, 4, function (result) {
    console.log(result);
});
