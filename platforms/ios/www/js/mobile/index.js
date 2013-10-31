/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var IOS_DEVICE = 1;
var ANDROID_DEVICE = 2;

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
    },
    registerGCM: function() {
        console.log("Registering GCM for"+device.platform);
        var pushNotification = window.plugins.pushNotification;

        if ( device.platform == 'android' || device.platform == 'Android' ) {
        	pushNotification.register(app.successHandler, 
				app.errorHandler,
				{"senderID":"852521907580","ecb":"app.onNotificationGCM"});
        } else {
        	console.log("Trying to register APN");
        	pushNotification.register(
		        tokenHandler,
		        errorHandler, {
		            "badge":"true",
		            "sound":"true",
		            "alert":"true",
		            "ecb":"onNotificationAPN"
		    });
        }
	
        console.log("Trying to register");
	//pushNotification.unregister(app.successHandler, app.errorHandler);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    },
// result contains any message sent from the plugin call
    successHandler: function(result) {
    	console.log("Success unregister");
        console.log(result);
        $("#console").html(result);
    },
    errorHandler:function(error) {
    	console.log("Error trying to unregister");
        alert(error);
    },
    onNotificationAPN: function(event) {
    	if ( event.alert ) {
            navigator.notification.alert(event.alert);
        }

        if ( event.sound ) {
            var snd = new Media(event.sound);
            snd.play();
        }

        if ( event.badge ) {
            pushNotification.setApplicationIconBadgeNumber(successHandler, 
            		errorHandler, event.badge);
        }
    },
    onNotificationGCM: function(e) {
        switch( e.event )
        {
            case 'registered':
                if ( e.regid.length > 0 )
                {
                    this.tokenHandler(e.regid, ANDROID_DEVICE);
                    //alert('registration id = '+e.regid);
                }
                break;

            case 'message':
                // this is the actual push notification. its format depends on the data model from the push server
            	console.log("Push notification received ..")
                showAlert(e.message);
            	//var pushNotification = window.plugins.pushNotification;
            	//pushNotification.unregister(app.successHandler, app.errorHandler);
                break;

            case 'error':
                alert('GCM error = '+e.msg);
                break;

            default:
                alert('An unknown GCM event has occurred');
                break;
        }
    },
    tokenHandler: function(token,deviceType) {
    	console.log("Regid " + token);
    	if (typeof deviceType == 'undefined') {
    		deviceType = IOS_DEVICE;
    	}
        var argsToSend = getCSRFPreventionObjectMobile('registerForPushNotificationCSRF', 
        		{ date:cachedDateUTC, userId:currentUserId, token:token,deviceType:deviceType});
		$.getJSON(makeGetUrl("registerForPushNotification"), makeGetArgs(argsToSend),
			function(data){
				if (checkData(data)) {
					console.log("Registered for push notification")
				}
		});
    }
    
};
