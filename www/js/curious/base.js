// Base Javascript library extensions

/*
 * Add universal startsWith method to all String classes
 */
String.prototype.startsWith = function(str) { return this.substring(0, str.length) === str; }
String.prototype.endsWith = function (str) { return this.length >= str.length && this.substr(this.length - str.length) == str; }

/*
 * Simple, clean Javascript inheritance scheme
 * 
 * Based on: http://kevinoncode.blogspot.com/2011/04/understanding-javascript-inheritance.html
 * 
 * Usage:
 * 
 * function Person(age) {
 * 	this.age = age;
 * }
 * 
 * function Fireman(age, station) {
 * 	Person.call(this, age);
 * 	this.station = station;
 * }
 * inherit(Fireman, Person);
 * 
 * var fireman = new Fireman(35, 1001);
 * assert(fireman.age == 35);
 * 
 * 
 */
function inherit(subclass, superclass) {
	function TempClass() {}
	TempClass.prototype = superclass.prototype;
	var newSubPrototype = new TempClass();
	newSubPrototype.constructor = subclass; 
	subclass.prototype = newSubPrototype;
}

/*
 * Low-level utility methods
 */
function arrayEmpty(arr) {
	for (var i in arr) {
		return false;
	}
	
	return true;
}

function removeElem(arr, elem) {
	return jQuery.grep(arr, function(v) {
		return v != elem;
	});
}

/*
 * Number/date formatting
 */
function isNumeric(str) {
	var chars = "0123456789.+-";

	for (i = 0; i < str.length; i++)
		if (chars.indexOf(str.charAt(i)) == -1)
			return false;
	return true;
}

function dateToTime(date) {
	if (typeof(date) == 'string') {
		return Date.parse(date);
	}
	return date.getTime();
}

function dateToTimeStr(d, shortForm) {
	var ap = "";
	var hour = d.getHours();
	if (hour < 12)
		ap = "am";
	else
		ap = "pm";
	if (hour == 0)
		hour = 12;
	if (hour > 12)
		hour = hour - 12;
	
	var min = d.getMinutes();
	
	if (shortForm && min == 0) {
		return hour + ap;
	}
	
	min = min + "";
	
	if (min.length == 1)
		min = "0" + min;
	
	return hour + ":" + min + ap;
}

//var DateUtil = new function() {
function DateUtil() {
	this.now = new Date();
}

DateUtil.prototype.getDateRangeForToday = function() {
	var now = this.now;
	var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
	var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
	return {
		start: start,
		end: end
	}
}

var numJSONCalls = 0;
var pendingJSONCalls = [];

function queuePostJSON(description, url, args, successCallback, failCallback, delay) {
	queueJSON(description, url, args, successCallback, failCallback, delay, true);
}

function queueJSON(description, url, args, successCallback, failCallback, delay, post) {
	var pending = true;
	if (typeof args == "function") {
		delay = failCallback;
		failCallback = successCallback
		successCallback = args;
		args = undefined;
	}
	if (args == undefined || args == null) {
		args = {dateToken:new Date().getTime()};
	} else if (!args['dateToken']) {
		args['dateToken'] = new Date().getTime();
	}
	var wrapSuccessCallback = function(data, msg) {
		if (successCallback)
			successCallback(data);
		--numJSONCalls;
		if (numJSONCalls < 0)
			numJSONCalls = 0;
		if (pendingJSONCalls.length > 0) {
			var nextCall = pendingJSONCalls.shift();
			nextCall();
		}
	};
	var wrapFailCallback = function(data, msg) {
		if (failCallback)
			failCallback(data);
		--numJSONCalls;
		if (numJSONCalls < 0)
			numJSONCalls = 0;
		if (pendingJSONCalls.length > 0) {
			var nextCall = pendingJSONCalls.shift();
			nextCall();
		}
		if (msg == "timeout") {
			if (delay * 2 > 1000000) { // stop retrying after delay too large
				showAlert("Server down... giving up");
				return;
			}
			if (!(delay > 0))
				showAlert("Server not responding... retrying " + description);
			delay = (delay > 0 ? delay * 2 : 5000);
			window.setTimeout(function() {
				queueJSON(description, url, args, successCallback, failCallback, delay);
			}, delay);
		}
	};
	if (numJSONCalls > 0) { // json call in progress
		var jsonCall = function() {
			$.ajax({
				type: (post ? "post" : "get"),
				dataType: "json",
				url: url,
				data: args,
				timeout: 20000 + (delay > 0 ? delay : 0)
			})
			.done(wrapSuccessCallback)
			.fail(wrapFailCallback);
		};
		++numJSONCalls;
		pendingJSONCalls.push(jsonCall);
	} else { // first call
		++numJSONCalls;
		$.ajax({
			type: (post ? "post" : "get"),
			dataType: "json",
			url: url,
			data: args,
			timeout: 20000 + (delay > 0 ? delay : 0)
		})
		.done(wrapSuccessCallback)
		.fail(wrapFailCallback);
	}
}

function backgroundJSON(description, url, args, successCallback, failCallback, delay, post) {
	if (typeof args == "function") {
		delay = failCallback;
		failCallback = successCallback
		successCallback = args;
		args = undefined;
	}
	if (args == undefined || args == null) {
		args = {dateToken:new Date().getTime()};
	} else if (!args['dateToken']) {
		args['dateToken'] = new Date().getTime();
	}
	var wrapFailCallback = function(data, msg) {
		if (failCallback)
			failCallback(data);
		if (msg == "timeout") {
			if (delay * 2 > 1000000) { // stop retrying after delay too large
				showAlert("Server down... giving up");
				return;
			}
			if (!(delay > 0))
				showAlert("Server not responding... retrying " + description);
			delay = (delay > 0 ? delay * 2 : 5000);
			window.setTimeout(function() {
				backgroundJSON(description, url, args, successCallback, failCallback, delay);
			}, delay);
		}
	};
	$.ajax({
		type: (post ? "post" : "get"),
		dataType: "json",
		url: url,
		data: args,
		timeout: 20000 + (delay > 0 ? delay : 0)
	})
	.done(successCallback)
	.fail(wrapFailCallback);
}

function clearJSONQueue() {
	numJSONCalls = 0;
	pendingJSONCalls = [];
}

var App = {};
App.CSRF = {};
window.App = App;
App.CSRF.SyncTokenKeyName = "SYNCHRONIZER_TOKEN"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_KEY
App.CSRF.SyncTokenUriName = "SYNCHRONIZER_URI"; // From org.codehaus.groovy.grails.web.servlet.mvc.SynchronizerTokensHolder.TOKEN_URI

/**
 * A method which returns an string representation of an url containing parameters
 * related to CSRF prevention. This is useful to concate url in any url string of ajax call,
 * @param key unique string which is passed in jqCSRFToken tag to create token.
 * @param prefix any string to append before generated url like: <b>&</b>.
 * @returns string representation of CSRF parameters.
 */
function getCSRFPreventionURI(key) {
	var preventionURI = App.CSRF.SyncTokenKeyName + "=" + App.CSRF[key] + "&" + App.CSRF.SyncTokenUriName + "=" + key;
	if(App.CSRF[key] == undefined) {
		console.error("Missing csrf prevention token for key", key);
	}
	return preventionURI;
}

/**
 * A method which returns an object containing key & its token based on given key.
 * This is useful to be easily passed in some jQuery methods like <b>getJSON</b>,
 * which accepts parameters to be passed as Object.
 * @param key unique string which is passed in jqCSRFToken tag to create token.
 * @param data optional object to attach to new object using jQuery's extend method.
 * @returns the object containing parameters for CSRF prevention.
 */
function getCSRFPreventionObject(key, data) {
	var CSRFPreventionObject = new Object();
	if(App.CSRF[key]) {
		CSRFPreventionObject[App.CSRF.SyncTokenKeyName] = App.CSRF[key];
	} else {
		console.error("Missing csrf prevention token for key", key);
	}
	CSRFPreventionObject[App.CSRF.SyncTokenUriName] = key;

	return $.extend(CSRFPreventionObject, data);
}

// Singleton Class function.
var RepeatType = new function() {
	this.CONTINUOUS_BIT = 0x100;
	this.GHOST_BIT = 0x200;
	this.CONCRETEGHOST_BIT = 0x400;
	this.TIMED_BIT = 0x1 | 0x2 | 0x4;
	this.REPEAT_BIT = 0x1 | 0x2;
	this.REMIND_BIT = 0x4;

	this.isConcreteGhost = function(repeatType) {
		return (repeatType & this.CONCRETEGHOST_BIT) != 0;
	}
	this.isContinuous = function(repeatType) {
		return (repeatType & this.CONTINUOUS_BIT) != 0;
	}
	this.isGhost = function(repeatType) {
		return (repeatType & this.GHOST_BIT) != 0;
	}
	this.isRemind = function(repeatType) {
		return (repeatType & this.REMIND_BIT) != 0;
	}
	this.isRepeat = function(repeatType) {
		return (repeatType & this.REPEAT_BIT) != 0;
	}
	this.isTimed = function(repeatType) {
		return (repeatType & this.TIMED_BIT) != 0;
	}
}