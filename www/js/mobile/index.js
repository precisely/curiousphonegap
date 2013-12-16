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
    	app.receivedEvent('deviceready');
    },
    registerNotification: function() {
        console.log("Registering Notification for "+device.platform);
        var pushNotification = window.plugins.pushNotification;
        console.log("Checking device type");
        if (app.isAndroid()) {
        	console.log("Device type = "+device.platform);
        	pushNotification.register(app.tokenHandler, 
				app.errorHandler, {"senderID":"852521907580","ecb":"window.app.onNotificationGCM"});
        } else {
        	console.log("Device type = "+device.platform);
        	pushNotification.register(
		        app.tokenHandler,
		        app.errorHandler, {
		            "badge":"true",
		            "sound":"true",
		            "alert":"true",
		            "ecb":"onNotificationAPN"
		    });
        }

    },
    refreshNotificationRegistration: function() {
    	console.log("Inside refresh notification");
    	var pushNotification = window.plugins.pushNotification;
    	pushNotification.unregister(function() { console.log("Unregistered Notification"); app.registerNotification(); }, 
    			function() { console.log("Error trying to unregister: "+error); app.registerNotification(); });
    },
    receivedEvent: function(id) {
        console.log('Received Event: ' + id);
    },
    errorHandler: function(error) {
    	console.log("Error trying to register: "+error);
    	var keys = [];
    	for(var key in obj){
    		console.log("Error property name "+key);
    		console.log("Error property val "+error[key]);
    	}
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
                	console.log("GCM Registered");
                	var argsToSend = getCSRFPreventionObjectMobile('registerForPushNotificationCSRF', 
                    		{ date:cachedDateUTC, userId:currentUserId, token:e.regid,deviceType:app.deviceType()});
            		$.getJSON(makeGetUrl("registerForPushNotification"), makeGetArgs(argsToSend),
            			function(data){
            				if (checkData(data)) {
            					console.log("Notification token saved on the server")
            				}
            		});
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
    tokenHandler: function(token) {
    	console.log("Regid " + token);
    	
    },
    deviceType: function() {
    	return app.isAndroid()?ANDROID_DEVICE:IOS_DEVICE;
    },
    isAndroid: function() {
    	return device.platform == 'android' || device.platform == 'Android';
    },
    isIOS: function() {
    	return device.platform == 'ios' || device.platform == 'iOS';
    }
    
};

app.serverUrl = "http://192.168.0.106:8080";

function makeGetUrl(url) {
	console.log("makeGetUrl at index.js");
	return app.serverUrl+"/mobiledata/" + url + '?callback=?';
}

function makePostUrl(url) {
	console.log("makePostUrl at index.js");
	return app.serverUrl+"/mobiledata/" + url;
}

function makePlainUrl(url) {
	var url = app.serverUrl+"/mobile/" + url;
	url = url;
	return url;
}