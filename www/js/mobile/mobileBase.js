function showAlert(alertText) {
	$("#alert-message-text").text(alertText);
	$("#alert-message").dialog({
		dialogClass : "no-close",
		modal : true,
		resizable : false,
		title : "Alert",
		buttons : {
			Ok : function() {
				$(this).dialog("close");
			}
		}
	});
}

function showYesNo(alertText, onConfirm) {
	$("#alert-message-text").text(alertText);
	$("#alert-message").dialog({
		dialogClass : "no-close",
		modal : true,
		resizable : false,
		title : "Query",
		buttons : {
			"Yes " : function() {
				$(this).dialog("close");
				onConfirm();
			},
			No : function() {
				$(this).dialog("close");
			}
		}
	});
}

var localStorageSupported = function() {
	try {
		localStorage.setItem("test", "test");
		localStorage.removeItem("test");
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

if (!localStorageSupported()) {
	console.log("HTML5 local storage error");
}

$.datepicker._gotoToday = function(id) {
	var target = $(id);
	var inst = this._getInst(target[0]);
	if (this._get(inst, 'gotoCurrent') && inst.currentDay) {
		inst.selectedDay = inst.currentDay;
		inst.drawMonth = inst.selectedMonth = inst.currentMonth;
		inst.drawYear = inst.selectedYear = inst.currentYear;
	} else {
		var date = new Date();
		inst.selectedDay = date.getDate();
		inst.drawMonth = inst.selectedMonth = date.getMonth();
		inst.drawYear = inst.selectedYear = date.getFullYear();
		// the below two lines are new
		this._setDateDatepicker(target, date);
		this._selectDate(id, this._getDateDatepicker(target));
	}
	this._notifyChange(inst);
	this._adjustDate(target);
}

var activateEntryId = -1;

function doLogout() {
	console.log("Logging out...");
	callLogoutCallbacks();
	localStorage['mobileSessionId'] = null;
	localStorage['appCache'] = null;
	localStorage['lastPage'] = 'login';
	startLogin(0);
	$(document).trigger("ask-logout");
}

function getCSRFPreventionURIMobile(key) {
	if (localStorage['mobileSessionId'] == undefined
			|| localStorage['mobileSessionId'] == null) {
		console.error("Missing mobileSessionId for CSRF protection");
	}
	var preventionURI = "mobileSessionId=" + localStorage['mobileSessionId'];
	return preventionURI;
}

function getCSRFPreventionObjectMobile(key, data) {
	var CSRFPreventionObject = new Object();
	if (localStorage['mobileSessionId']) {
		CSRFPreventionObject['mobileSessionId'] = localStorage['mobileSessionId'];
	} else {
		console.error("Missing mobileSessionId for CSRF protection");
	}

	return $.extend(CSRFPreventionObject, data);
}

function addPerson(name, username, userId, sex) {
	if (sex == 'F')
		sex = 'Female';
	if (sex == 'M')
		sex = 'Male';
	$('#displayUser').html(username);
}

function resetDefaultText($element, backImage) {
	$element.data('defaultTextCleared', false);
	$element.val('');
	$element.css('background-image', backImage);
}

function submitForm() {
	if (!isOnline()) {
		showAlert("Please wait until online");
		return;
	}
	var email = $("#emailField").val();
	var username = $("#usernameField").val();
	var password = $("#passwordField").val();

	if (loginMode == 0) { // login
		$
				.getJSON(
						makeGetUrl('dologinData'),
						makeGetArgs({
							username : username,
							password : password
						}),
						function(data) {
							if (data['success']) {
								localStorage['mobileSessionId'] = data['mobileSessionId'];
								dataReady = true;
								$("#passwordField").blur();
								launchTrack();
								$(document).trigger("login-success");
							} else {
								showAlert('Username or password not correct, please try again');
								startLogin(0);
							}
						});
	} else if (loginMode == 10) { // forgot password
		$.getJSON(
			makeGetUrl('doforgotData'),
			makeGetArgs({
				username : username
			}),
			function(data) {
				if (data['success']) {
					showAlert('Look for instructions on recovering your account information in your email.');
					startLogin(0);
				} else {
					showAlert(data['message']
						+ " Please try again or hit Cancel to return to the login screen.");
				}
			});
	} else if (loginMode == 20) { // create an account
		$.postJSON(
			makePostUrl('doregisterData'),
			makePostArgs({
				email : email,
				username : username,
				password : password,
				groups : "['announce','curious','curious announce']"
			}),
			function(data) {
				if (data['success']) {
					localStorage['mobileSessionId'] = data['mobileSessionId'];
					dataReady = true;
					launchTrack();
				} else {
					showAlert(data['message']
						+ ' Please try again or hit Cancel to return to the login screen.');
					}
			}
		);
	}
}

var submitLogin = function(e) {
	if (!$(this).data('defaultTextCleared')) {
		$(this).data('defaultTextCleared', true);
		$(this).val('');
		$(this).css('background-image', 'none');
		$(this).css('color', '#000000');
	}
	if (e.keyCode == 13)
		submitForm();
}

// Main page logic after full page load
var initLoginPage = function() {
	localStorage['lastPage'] = 'login';

	$("#emailField").val('');
	$("#usernameField").val('');
	$("#passwordField").val('');
	$("#emailField").off("keydown");
	$("#usernameField").off("keydown");
	$("#passwordField").off("keydown");
	$("#emailField").on("keydown", submitLogin);
	$("#usernameField").on("keydown", submitLogin);
	$("#passwordField").on("keydown", submitLogin);
}

function askLogout() {
	showYesNo("Log out?", function() {
		doLogout();
	});
}

// flag to determine whether the system is ready to submit data
var dataReady = false;

if (!localStorage['mobileSessionId']
		|| localStorage['mobileSessionId'] == undefined) {
	console.log("error: local session is cleared");
	doLogout(); // clear JSON cache and start over
}

function isLoggedIn() {
	return localStorage['mobileSessionId'] != null;
}

function makeGetUrl(url) {
	return "/mobiledata/" + url + '?callback=?';
}

function makeGetArgs(args) {
	args['mobileSessionId'] = localStorage['mobileSessionId'];

	return args;
}

function makePostUrl(url) {
	return "/mobiledata/" + url;
}

function makePostArgs(args) {
	args['mobileSessionId'] = localStorage['mobileSessionId'];

	return args;
}

function makePlainUrl(url) {
	var url = "/mobile/" + url;
	url = url;
	return url;
}

function initAppCache() {
	if (supportsLocalStorage()) {
		if (localStorage['appCache'] == null) {
			localStorage['appCache'] = {};
			localStorage['lastPage'] = null;
			return;
		}
	}
}

function getAppCacheData(key) {
	if (supportsLocalStorage()) {
		try {
			return JSON.parse(localStorage[key]);
		} catch(err) {
			console.log('Unable to fetch or parse data from cache. Key: '+key);
			console.log('Cache value at '+key+': '+localStorage[key]);
			return null;
		}
	}
}

function setAppCacheData(key,value) {
	if (supportsLocalStorage()) {
		try {
			if (typeof value == 'object') {
				localStorage[key] = JSON.stringify(value);
			} else {
				localStorage[key] = value;
			}
			
			return true;
		} catch(err) {
			console.log('Unable to save data to cache. Error: '+err);
			return false;
		}
	}
}

/**
 * Returning the dates for which the entries are cached
 * 
 * @returns {Array}
 */
function getEntryBucket() {
	var entryBucketKey = 'appCache.entryCacheBucket';
	var entryBucket = getAppCacheData(entryBucketKey); 
	if (entryBucket == null) {
		entryBucket = [];
		// Fallback, recreating bucket from localStorage
		// for installations that already have cached data
		// but no buckets
		for (var prop in localStorage) {
			if (prop.indexOf('appCache.entryCache.') > -1) {
				//Pushing just the date part
				entryBucket.push(prop.substring(20));
			}
		}
		setEntryBucket(entryBucket);
	}
	return entryBucket;
}

function setEntryBucket(entryBucket) {
	var entryBucketKey = 'appCache.entryCacheBucket';
	setAppCacheData(entryBucketKey, entryBucket);
}

/**
 * Helper method to confirm if an entry already exists
 * in the bucket.
 * @param dateStr mm/dd/yyyy date for which the check needs to be made
 * @returns {Boolean} returns true if the cache exists
 */
function isEntryCached(dateStr) {
	var entryBucket = getEntryBucket();
	for (var i=0; i<entryBucket.length; i++) {
        if (entryBucket[i] === dateStr) {
            return true;
        }
    }
	return false;
}

/**
 * Helper method, fetches the cached entries for a given date
 * @param date
 * @returns List of entries
 */
function getEntryCache(date) {
	var month = ("0" + (date.getMonth() + 1)).slice(-2);
	var day = ("0" + date.getDate()).slice(-2);
	var dateStr = month + '/' + day + '/' + (date.getYear() + 1900);
	return getAppCacheData('appCache.entryCache.'+dateStr);
	
}

/**
 * Fetching entries for a particular date(s) from the server
 */

function fetchEntries(dates, callback) {
	if (typeof callback != 'undefined') {
		console.log('fetchEntries: Missing a callback');
	}
	
	var argsToSend = getCSRFPreventionObjectMobile('getListDataCSRF', {
		date : dates,
		userId : currentUserId,
		timeZoneName : timeZoneName
	});
	$.getJSON(makeGetUrl("getListData"), makeGetArgs(argsToSend),
		function(data) {
			if (checkData(data)) {
				console.log("fetching entries from the server");
					callback(data);
			}
		});
}

/**
 * Storing the entries for a given day in a local entry cache.
 * The entry cache has an upper limit of 10. Only the last 10
 * days that were fetched get cached 
 * @param date 
 * @param entries Entries for the above date
 * @returns {Boolean}
 */
function setEntryCache(date,entries) {
	var dateStr;
	var entryBucket = getEntryBucket();
	
	if (typeof date == 'object') {
		var month = ("0" + (date.getMonth() + 1)).slice(-2);
		var day = ("0" + date.getDate()).slice(-2);
		dateStr = month + '/' + day + '/' + (date.getYear() + 1900);
	} else {
		dateStr = date;
	}
	
	if (setAppCacheData('appCache.entryCache.'+dateStr,entries)) {
		if (!isEntryCached(dateStr)) {
			entryBucket.push(dateStr);
			if (entryBucket.length > 10) {
				localStorage.removeItem('appCache.entryCache.'+entryBucket[0]);
				entryBucket.shift();
			}
			setEntryBucket(entryBucket);
		}
		return true;
	} else {
		return false;
	}
}

function clearEntryCache() {
	for (var key in localStorage) {
		if (key.indexOf("appCache.entryCache")>-1) {
			localStorage.removeItem(key);
		}
	}
}

var pageLoaded = false;

// mode:
// 0:login
// 10:forgot password
// 20:create account

var loginMode = 0;

function startLogin(mode) {
	if (pageLoaded) {
		loginMode = mode;

		if (supportsLocalStorage()) {
			localStorage['mobileSessionId'] = null;
			clearEntryCache();
			localStorage['lastPage'] = 'login';
		}
		$('#trackPage').hide();

		resetDefaultText($("#emailField"), 'url(../images/email.png)');
		resetDefaultText($("#passwordField"), 'url(../images/password.png)');
		resetDefaultText($("#usernameField"), 'url(../images/username.png)');
		if (mode == 0) { // login
			$("#loginlogo").css('margin-bottom', '50px');
			$("#emailDiv").hide();
			$("#usernameDiv").show();
			$("#passwordDiv").show();
			$("#recoverinfoDiv").hide();
			$("#createaccountDiv").hide();
			$("#loginButtonDiv").show();
			$("#cancelButtonDiv").hide();
			$("#loginoptionsDiv").show();
		} else if (mode == 10) { // forgot password
			$("#loginlogo").css('margin-bottom', '10px');
			$("#emailDiv").hide();
			$("#usernameDiv").show();
			$("#passwordDiv").hide();
			$("#recoverinfoDiv").show();
			$("#createaccountDiv").hide();
			$("#loginButtonDiv").hide();
			$("#cancelButtonDiv").show();
			$("#loginoptionsDiv").hide();
		} else if (mode == 20) { // create account
			$("#loginlogo").css('margin-bottom', '10px');
			$("#emailDiv").show();
			$("#usernameDiv").show();
			$("#passwordDiv").show();
			$("#recoverinfoDiv").hide();
			$("#createaccountDiv").show();
			$("#loginButtonDiv").hide();
			$("#cancelButtonDiv").show();
			$("#loginoptionsDiv").hide();
		}
		$('#loginPage').show(0, initLoginPage);
	}
}

function recoverPassword() {
	startLogin(10);
}

function createAccount() {
	startLogin(20);
}

function startTrack() {
	localStorage['lastPage'] = 'track';
	$('#loginPage').hide();
	$('#trackPage').show(0, initTrackPage);
}

function launchTrack() {
	localStorage['lastPage'] = 'track';
	reloadPage();
}

/*
 * If no local storage mobile session, show login page If login submit and
 * offline, show alert saying must be online If login submit and online, attempt
 * to log in If success, clear cache show track page and load track page If
 * local storage mobile session If last page is track page Show track page and
 * retrieve track info Until fully online don't allow entry submission If submit
 * entry and not yet fully online put up error dialog (in future cache entry for
 * future sync) If last page is login page Show login page
 */
function reloadPage() {
	var mobileSessionId = localStorage['mobileSessionId'];
	if (!mobileSessionId) {
		console.log("mobileSessionId not found!");
		doLogout();
	} else { // mobile session exists
		if (localStorage['lastPage'] == 'track'
				|| localStorage['lastPage'] == null) {
			startTrack();
		} else {
			console.log("lastPage isn't track or cleared")
			doLogout();
		}
	}
}

$(window).load(function() {
	pageLoaded = true;
	reloadPage();
});

var defaultToNow = true;
var timeAfterTag = true;
var CONTINUOUS_BIT = 0x100;
var GHOST_BIT = 0x200;
var CONCRETEGHOST_BIT = 0x400;
var TIMED_BIT = 0x1 | 0x2 | 0x4;
var REPEAT_BIT = 0x1 | 0x2;
var REMIND_BIT = 0x4;

var cachedDate, cachedDateUTC;
var $datepickerField;

$(document).ready(function() {
	$datepickerField = $("input#datepicker");
	if (window.location.href.indexOf("lamhealth") > -1) {
		$("#loginlogo").attr("src", "../images/logo_mobile_lhp.gif");
	}

	$('#loginlogo').show();
	
	$('body').on('swiperight', function() {
		console.log('Swipe event right');
		swipeTrackPage(false);
	}).on("swipeleft", function() {
		console.log("Swipe event left");		
		swipeTrackPage(true);
	});
	$('#trackPage').on('vmousedown', function (event) {
		window.moveStartY = event.pageY;
		console.log('Move Start Y on Tap: ' + window.moveStartY);
	});
	
	$('#trackPage').on('vmouseup', function(event) {
		var moveVerticalDirection = window.moveStartY - event.pageY;
		console.log('Move Start Y on move: ' + window.moveStartY);
		console.log('pageY on move: ' + event.pageY);
		console.log('Move Direction: ' + moveVerticalDirection);
		if (moveVerticalDirection < 0 && -moveVerticalDirection > 40) {
			$('#fetchingData').show();
			fetchEntries(cachedDateUTC, function (entries) {
				refreshEntries(entries, true);
				dataReady = true;
				$('#fetchingData').hide();
				console.log('Data refreshed from the server');
			});
			
		}
	});
});

/**
 * Adding another dummy track page and then simulating a slide.
 * Eventually removing the dummy trackpage that was added.
 * @param left accepting sign +/- as a param to animate left or right
 */
function swipeTrackPage (left) {
	var $originalPage = $($('.trackDay')[0]); 
	var width = $originalPage.width();
	$originalPage.clone().appendTo('#trackPage');
	var $dummyTrackPage = $($('.trackDay')[1]);
	$dummyTrackPage.css({left: '0px'});
	var dummyPageDirection = "";
	if(left) {
		$originalPage.css({left: width+'px'});
		dummyPageDirection = '-';
		changeDate(+1);
	} else {
		$originalPage.css({left: '-'+width+'px'});
		changeDate(-1);
	}
	$dummyTrackPage.animate(
			{
				left: dummyPageDirection+width+'px'
			},
			250,
			function () {
				$dummyTrackPage.remove();
			}
	);
	
	$originalPage.animate(
		{
			left: '0px'
		},
		250
	);
} 

function cacheDate() {
	cachedDate = $datepickerField.datepicker('getDate');
	cachedDateUTC = cachedDate.toUTCString();
	cachedDateYesterday = new Date(cachedDate);
	cachedDateYesterday.setDate(cachedDate.getDate()-1);
	cachedDateTomorrow = new Date(cachedDate);
	cachedDateTomorrow.setDate(cachedDate.getDate()+1);
	
}

var currentTimeUTC;
var timeZoneName;
var cachedDateTomorrow;
var cachedDateYesterday;

function cacheNow() {
	cacheDate();
	var now = new Date();
	currentTimeUTC = now.toUTCString();
	timeZoneName = jstz.determine().name();
}

function changeDate(amount) {
	var $datepicker = $("#datepicker");
	var currentDate = $datepicker.datepicker('getDate');
	$datepicker.datepicker('setDate', new Date(currentDate.getTime() + amount
			* 86400000));
	cachedDate = currentDate;
	refreshPage();
}

function refreshPage(callback) {
	cacheNow();

	var cachedObj = getEntryCache(cachedDate);
	var cacheForYesterdayAndTomorrow = {};
	cacheForYesterdayAndTomorrow[cachedDateYesterday.toUTCString()] = getEntryCache(cachedDateYesterday);
	cacheForYesterdayAndTomorrow[cachedDateTomorrow.toUTCString()] = getEntryCache(cachedDateTomorrow);

	if (cachedObj != null) {
		console.log("refresh entries from cache");
		refreshEntries(cachedObj, false, false);
	} else {
		fetchEntries(cachedDateUTC, function (entries) {
			refreshEntries(entries, true);
			dataReady = true;
			if (typeof callback != 'undefined') {
				callback();
			}
		});
	}
	
	var otherDatesToFetch = [];
	
	for (var entryDate in cacheForYesterdayAndTomorrow) {
		if (cacheForYesterdayAndTomorrow[entryDate] == null) {
			console.log("");
			otherDatesToFetch.push(entryDate);
		}
	}
	
	if (otherDatesToFetch.length > 0) {
		fetchEntries(otherDatesToFetch, function(entriesList) {
			for (var entryDate in entriesList) {
				setEntryCache(entryDate, data[entryDate]);
			}
		});
	}
}

var currentEntryId = undefined;

function clearEntries() {
	currentEntryId = undefined;
	$("#entry0").html('');
}

/*
 * Gets called on selection of the entry, or used to select an entry.
 */

var mouseDownOnDeleteEntry = false; // Used to track mousedown during blur even
function selected($selectee, forceUpdate) {
	var state = $selectee.data('entryIsSelected');
	$selectee.data('forceUpdate', forceUpdate);
	var $contentWrapper = $selectee.find(".content-wrapper");
	if ($("#tagTextInput").size() == 1)
		return;
	$selectee.siblings().removeClass("ui-selected").data('entryIsSelected', 0);

	if (state == undefined || state == 0) {
		$selectee.addClass('ui-selected');
		$selectee.data('entryIsSelected', 1);
		$selectee.data('contentHTML', $contentWrapper.html()); // store
		// original HTML
		// for later
		currentEntryId = $selectee.data("entry-id");
		$("#entrydelid" + currentEntryId).css('display', 'inline');
		var entryText = $selectee.text();
		var selectRange = entrySelectData[currentEntryId];
		if (selectRange != undefined) {
			if (selectRange[2]) { // insert space at selectRange[0]
				entryText = entryText.substr(0, selectRange[0] - 1) + " " + entryText.substr(selectRange[0] - 1);
			}
		}
		$selectee.data('originalText', entryText); // store entry text for comparison

		$contentWrapper.hide();
		$selectee
				.append('<span id="tagTextEdit" style="display:inline"><input type="text" id="tagTextInput" style="margin: 2px; width: calc(100% - 110px);"></input>'
						+ '<img class="entryModify entryNoBlur" src="../images/repeat.png" id="tagEditRepeat" style="width:14px;height:14px;padding-left:1px;padding-top:2px;">'
						+ '<img class="entryModify entryNoBlur" src="../images/remind.png" id="tagEditRemind" style="width:14px;height:14px;padding-left:1px;padding-top:2px;">'
						+ '<img class="entryModify entryNoBlur" src="../images/pin.png" id="tagEditPinned" style="width:14px;height:14px;padding-left:1px;padding-top:2px;"></span>');

		$("#tagEditRepeat").off("mousedown");
		$("#tagEditRemind").off("mousedown");
		$("#tagEditPinned").off("mousedown");

		$("#tagEditRepeat").on("mousedown", function(e) {
			modifyEdit('repeat');
		});
		$("#tagEditRemind").on("mousedown", function(e) {
			modifyEdit('remind');
		});
		$("#tagEditPinned").on("mousedown", function(e) {
			modifyEdit('pinned');
		});

		// Adding logic to prevent blur from activating when clicking on certain controls
		$("#tagTextInput").bind('focus', function() {
			$(document).bind('mousedown', function(e) {
				var $target = $(e.target);
				if ($target.closest('#tagTextEdit').length) return;
				if (! $target.closest('.entryNoBlur').length) {
					//if ($target.data('cancelBlur')) return;
					$selectee.data('entryIsSelected', 0);
					var $unselectee = $target.parents("li");
					checkAndUpdateEntry($unselectee);
					$unselectee.data('entryIsSelected', 1);
					unselecting($unselectee);
				}
				$(document).unbind('mousedown', arguments.callee);
			});
		});
		
		var $textInput = $("#tagTextInput").val(entryText).focus();
		
		$textInput.keyup(function(e) {
			var $selectee = $(this).parents("li");
			if (e.keyCode == 13) { // Enter pressed
				unselecting($selectee);
			} else if (e.keyCode == 27) { // Esc pressed
				unselecting($selectee, true);
			}
		});

		if (selectRange) {
			$("#tagTextInput").selectRange(selectRange[0], selectRange[1]);
		}
	} else if (state == 2) {
		$selectee.data('entryIsSelected', 0);
	}
}

function activateEntry($entry, doNotSelectEntry) {
	console.log("Activating entry");
	console.log($entry);
	var gEntry = $entry;
	var entryId = $entry.data("entry-id");
	var isContinuous = $entry.data("isContinuous");
	var isGhost = $entry.data("isGhost");

	if (!isGhost) {
		selected($entry, false);
		return;
	}
	cacheNow();
	$
			.getJSON(
					makeGetUrl("activateGhostEntry"),
					makeGetArgs(getCSRFPreventionObjectMobile(
							"activateGhostEntryCSRF", {
								entryId : entryId,
								date : cachedDateUTC,
								currentTime : currentTimeUTC,
								timeZoneName : timeZoneName
							})),
					function(newEntry) {
						if (checkData(newEntry)) {
							// newEntry.glow = true;
							var newEntryId = newEntry.id;
							if (isContinuous) {
								var $lastContinuousGhostEntry = $("#entry0 li.entry.ghost.continuous:last");
								displayEntry(
										newEntry,
										false,
										{
											appendAfterEntry : $lastContinuousGhostEntry
										});
							} else {
								activateEntryId = newEntry.id;
								displayEntry(newEntry, false, {
									replaceEntry : gEntry
								});
							}
							var $newEntry = $("li#entryid" + newEntryId);
							if (!doNotSelectEntry) {
								selected($newEntry, true);
							}
						}
					});
}

var dayDuration = 86400000;
var entrySelectData;

function unselecting($unselectee) {
	if ($unselectee.data('entryIsSelected') == 1) {
		var $textInput = $("#tagTextInput");
		$unselectee.data('entryIsSelected', 0);
		$unselectee.removeClass('ui-selected');
		$("a.entryDelete", $unselectee).hide();
		checkAndUpdateEntry($unselectee);
		currentEntryId = null;
	}
}

function glow(entryId) {
	var $entry;
	if (typeof entryId == "string") {
		$entry = $("#" + entryId);
	} else {
		$entry = entryId;
	}
	$entry.addClass("glow");
	setTimeout(function() {
		$entry.removeClass("glow");
	}, 500);
};

function displayEntry(entry, isUpdating, args) {
	var id = entry.id, date = entry.date, datePrecisionSecs = entry.datePrecisionSecs, description = entry.description, amount = entry.amount, amountPrecision = entry.amountPrecision, units = entry.units, comment = entry.comment, classes = "entry", glowEntry = entry.glow, $entryToReplace, $appendAfterEntry;

	entry.glow = false;

	if (args && args instanceof Object) {
		if (args.replaceEntry) {
			$entryToReplace = $(args.replaceEntry);
		}
		if (args.appendAfterEntry) {
			$appendAfterEntry = $(args.appendAfterEntry);
		}
	}

	var isGhost = false, isConcreteGhost = false, isAnyGhost = false, isContinuous = false, isTimed = false, isRepeat = false, isRemind = false;
	if (entry.repeatType) {
		if ((entry.repeatType & GHOST_BIT) != 0) {
			isGhost = true;
			isAnyGhost = true;
			classes += " ghost anyghost";
		}
		if ((entry.repeatType & CONCRETEGHOST_BIT) != 0) {
			isConcreteGhost = true;
			isAnyGhost = true;
			classes += " concreteghost anyghost";
		}
		if ((entry.repeatType & CONTINUOUS_BIT) != 0) {
			isContinuous = true;
			classes += " continuous"
		}
		if ((entry.repeatType & TIMED_BIT) != 0) {
			isTimed = true;
			classes += " timedrepeat"
		}
		if ((entry.repeatType & REPEAT_BIT) != 0) {
			isRepeat = true;
		}
		if ((entry.repeatType & REMIND_BIT) != 0) {
			isRemind = true;
		}
	}

//	var diff = dateToTime(date) - cachedDate.getTime();
//	if (diff < 0 || diff >= dayDuration) {
//		return null; // skip items outside display
//	}
	var dateStr = '';
	if (datePrecisionSecs < 43200) {
		dateStr = dateToTimeStr(new Date(date), false);
		if (timeAfterTag) {
			dateStr = ' ' + dateStr;
		} else {
			dateStr = dateStr + ' ';
		}
	}
	// store amount for post-selection highlighting

	var formattedAmount = formatAmount(amount, amountPrecision);
	var selectStart = (timeAfterTag ? 0 : dateStr.length) + description.length + 1 + (formattedAmount.length == 0 ? 1 : 0);
	var selectEnd = selectStart + formattedAmount.length - 1;
	entrySelectData[id] = [selectStart, selectEnd, formattedAmount == 0]; // if third item is true, insert extra space at cursor
	
	var innerHTMLContent = '<span class="content-wrapper">'
			+ (timeAfterTag ? '' : escapehtml(dateStr))
			+ escapehtml(description)
			+ escapehtml(formattedAmount)
			+ escapehtml(formatUnits(units))
			+ (timeAfterTag ? escapehtml(dateStr) : '')
			+ (comment != '' ? ' ' + escapehtml(comment) : '')
			+ '</span><a class="entryDelete entryNoBlur" id="entrydelid'
			+ id
			+ '" href="#" onMouseDown="deleteEntryId('
			+ id
			+ ')"><img style="width="12" height="12" src="../images/x.gif"></a>';

	if (isUpdating) {
		$("#entry0 li#entryid" + id).html(innerHTMLContent);
	} else {
		var newEntryContent = '<li id="entryid' + id + '" class="' + classes
				+ '">' + innerHTMLContent + '</li>';
		if ($entryToReplace) {
			$entryToReplace.replaceWith(newEntryContent);
		} else if ($appendAfterEntry) {
			$appendAfterEntry.after(newEntryContent);
		} else {
			$("#entry0").append(newEntryContent);
		}
		if (glowEntry) {
			glow($("li#entryid" + id));
		}

	}

	var $entryItem = $("#entry0 li#entryid" + id);

	var data = {
		entry : entry,
		entryId : id,
		isGhost : isGhost,
		isConcreteGhost : isConcreteGhost,
		isAnyGhost : isAnyGhost,
		isContinuous : isContinuous,
		isTimed : isTimed,
		isRepeat : isRepeat,
		isRemind : isRemind
	};

	$entryItem.data(data);
	if (id == activateEntryId) {
		return $entryItem;
	}

	return null;
}

function displayEntries(entries) {
	entrySelectData = {};
	var $entryToActivate = null;
	jQuery.each(entries, function() {
		var args = {};
		var $retVal = displayEntry(this, false, args);
		if ($retVal) {
			$entryToActivate = $retVal;
		}
		return true;
	});

	return $entryToActivate;
}

function refreshEntries(entries, activateGhost, cache) {
	clearEntries();
	var $entryToActivate = displayEntries(entries);
	cache = typeof cache !== 'undefined' ? cache : true;
	
	if (cache) {
		setEntryCache(cachedDate, entries);
	}

	if (activateGhost && $entryToActivate) {
		activateEntry($entryToActivate);
		activateEntryId = -1;
	}
}

function toggleSuffix($control, suffix) {
	var text = $control.val();

	if (text.endsWith(" repeat")) {
		text = text.substr(0, text.length - 7);
		$control.val(text);

		if (suffix == "repeat")
			return text.length > 0;
	}
	if (text.endsWith(" remind")) {
		text = text.substr(0, text.length - 7);
		$control.val(text);

		if (suffix == "remind")
			return text.length > 0;
	}
	if (text.endsWith(" pinned")) {
		text = text.substr(0, text.length - 7);
		$control.val(text);

		if (suffix == "pinned")
			return text.length > 0;
	}

	$control.val(text + " " + suffix);

	return text.length > 0;
}

function modifyEdit(suffix) {
	var $control = $('#tagTextInput');
	if (toggleSuffix($control, suffix)) {
		var $selectee = $control.parents("li");
		unselecting($selectee);
		selected($selectee, false);
	}
}

function modifyInput(suffix) {
	initInput();
	// toggleSuffix($('#input0'), suffix);
	if (toggleSuffix($('#input0'), suffix))
		processInput();
}

function deleteGhost($entryToDelete, entryId, allFuture) {
	$.getJSON(makeGetUrl("deleteGhostEntryData"),
			makeGetArgs(getCSRFPreventionObjectMobile(
					"deleteGhostEntryDataCSRF", {
						entryId : entryId,
						all : (allFuture ? "true" : "false"),
						date : cachedDateUTC
					})), function(ret) {
				if (checkData(ret, 'success', "Error deleting entry")) {
					$entryToDelete.remove();
				}
			});
}

function deleteEntryId(entryId) {
	cacheNow();
	if (!dataReady) {
		// alert("Please wait until syncing is done before deleting entries");
		startLogin(0);
		return;
	}
	if (!isOnline()) {
		showAlert("Please wait until online to delete an entry");
		return;
	}
	if (entryId == undefined) {
		showAlert("Please select entry you wish to delete");
	} else {
		var $entryToDelete = getEntryElement(entryId);
		if ($entryToDelete.data("isTimed") || $entryToDelete.data("isGhost")) {
			if ($entryToDelete.data("isContinuous")) {
				deleteGhost($entryToDelete, entryId, true);
			} else {
				showAB("Delete just this one event or also future events?",
						"One", "Future", function() {
							deleteGhost($entryToDelete, entryId, false);
						}, function() {
							deleteGhost($entryToDelete, entryId, true);
						});
			}
		} else {
			var argsToSend = getCSRFPreventionObjectMobile(
					"deleteEntryDataCSRF", {
						entryId : entryId,
						currentTime : currentTimeUTC,
						baseDate : cachedDateUTC,
						timeZoneName : timeZoneName,
						displayDate : cachedDateUTC
					});

			$.getJSON(makeGetUrl("deleteEntrySData"), makeGetArgs(argsToSend),
					function(entries) {
						if (checkData(entries)) {
							refreshEntries(entries[0], false);
							updateAutocomplete(entries[1][0], entries[1][1],
									entries[1][2], entries[1][3]);
							if (entries[2] != null)
								updateAutocomplete(entries[2][0],
										entries[2][1], entries[2][2],
										entries[2][3]);
						} else {
							showAlert("Error deleting entry");
						}
					});
		}
	}
}

function deleteCurrentEntry() {
	deleteEntryId(currentEntryId);
}

/**
 * Sees to check if text is different from original text. IF different than call
 * updateEntry() method to notify server and update in UI.
 */
function checkAndUpdateEntry($unselectee) {
	var $contentWrapper = $unselectee.find(".content-wrapper");
	
	var newText = $("input#tagTextInput").val();
	var $oldEntry = getEntryElement(currentEntryId);
	$oldEntry.addClass("glow");
	if (($oldEntry.data('originalText') == newText) && (!$unselectee.data('forceUpdate'))) {
		setTimeout(function() {
			$oldEntry.removeClass("glow");
		}, 500)
		var $contentWrapper = $oldEntry.find(".content-wrapper");
		$contentWrapper.html($oldEntry.data('contentHTML'));
		$contentWrapper.show();
	} else {
		$contentWrapper.show();
		$unselectee.addClass("glow");
		$unselectee.data('forceUpdate', 0);
		$contentWrapper
				.append("&nbsp;&nbsp;<img src='../images/spinner.gif' />");
		updateEntry(currentEntryId, newText, defaultToNow);
	}
	
	$("#tagTextEdit").remove();
}

function getEntryElement(entryId) {
	return $("li#entryid" + entryId);
}

function doUpdateEntry(entryId, text, defaultToNow, allFuture) {
	cacheNow();

	var argsToSend = getCSRFPreventionObjectMobile("updateEntrySDataCSRF", {
		entryId : entryId,
		currentTime : currentTimeUTC,
		text : text,
		baseDate : cachedDateUTC,
		timeZoneName : timeZoneName,
		defaultToNow : defaultToNow ? '1' : '0',
		allFuture : allFuture ? '1' : '0'
	});

	$.getJSON(makeGetUrl("updateEntrySData"), makeGetArgs(argsToSend),
			function(entries) {
				if (entries == "") {
					return;
				}
				// Temporary fix since checkData fails
				if (typeof entries[0] != 'undefined' && entries[0].length > 0) {
					$.each(entries[0], function(index, entry) {
						// Finding entry which is recently updated.
						if (entry.id == entryId) {
							entry.glow = true;
						}
					})
					refreshEntries(entries[0]);
					
					updateAutocomplete(entries[1][0], entries[1][1],
							entries[1][2], entries[1][3]);
					if (entries[2] != null)
						updateAutocomplete(entries[2][0], entries[2][1],
								entries[2][2], entries[2][3]);
				} else {
					showAlert("Error updating entry");
				}
			});
}

function updateEntry(entryId, text, defaultToNow) {
	if (!dataReady) {
		// alert("Please wait until syncing is done before editing entries");
		startLogin(0);
		return;
	}
	if (!isOnline()) {
		showAlert("Please wait until online to update an entry");
		return;
	}
	var $oldEntry = getEntryElement(entryId);
	$oldEntry.addClass("glow");
	$(".content-wrapper", $oldEntry).html(text);
	if (($oldEntry.data("isRepeat") && (!$oldEntry.data("isRemind")))
			|| $oldEntry.data("isGhost")) {
		showAB("Update just this one event or also future events?", "One",
				"Future", function() {
					doUpdateEntry(entryId, text, defaultToNow, false);
				}, function() {
					doUpdateEntry(entryId, text, defaultToNow, true);
				});
	} else
		doUpdateEntry(entryId, text, defaultToNow, true);
}

function addEntry(userId, text, defaultToNow) {
	cacheNow();

	if (!dataReady) {
		// alert("Please wait until syncing is done before adding entries");
		startLogin(0);
		return;
	}
	if (!isOnline()) {
		showAlert("Please wait until online to add an entry");
		return;
	}
	var argsToSend = getCSRFPreventionObjectMobile("addEntryCSRF", {
		currentTime : currentTimeUTC,
		userId : userId,
		text : text,
		baseDate : cachedDateUTC,
		timeZoneName : timeZoneName,
		defaultToNow : defaultToNow ? '1' : '0'
	})

	$.getJSON(makeGetUrl("addEntrySData"), makeGetArgs(argsToSend), function(
			entries) {
		if (checkData(entries)) {
			if (entries[1] != null) {
				showAlert(entries[1]);
			}
			$.each(entries[0], function(index, entry) {
				// Finding entry which is recently added.
				if (entry.id == entries[3].id) {
					entry.glow = true;
				}
			})
			refreshEntries(entries[0], false);
			updateAutocomplete(entries[2][0], entries[2][1], entries[2][2],
					entries[2][3]);
		} else {
			showAlert("Error adding entry");
		}
	});
}

function initInput() {
	$("#input0").css('color', '#000000');
}

function processInput(forceAdd) {
	var $field = $("#input0");
	$field.autocomplete("close");
	var text = $field.val();
	if (text == "")
		return; // no entry data
	$field.val("");
	$field.blur();
	if ((!forceAdd) && (currentEntryId != undefined))
		updateEntry(currentEntryId, text, defaultToNow);
	else {
		addEntry(currentUserId, text, defaultToNow);
	}
	return true;
}

function setEntryText(text, startSelect, endSelect) {
	var $inp = $("#input0");
	$inp.autocomplete("close");
	$inp.data('defaultTextCleared', true);
	$inp.val(text);
	$inp.css('color', '#000000');
	if (startSelect) {
		$inp.selectRange(startSelect, endSelect);
	}
}

var clearDefaultLoginText = function(e) {
	if (!$(this).data('defaultTextCleared')) {
		setEntryText('');
	}
}

function setPeopleData(data) {
	if (data == null)
		return;
	jQuery.each(data, function() {
		// set first user id as the current
		addPerson(this['first'] + ' ' + this['last'], this['username'],
				this['id'], this['sex']);
		setUserId(this['id']);
		return true;
	});
}

var initTrackPage = function() {
	localStorage['lastPage'] = 'track';

	var $datepicker = $("#datepicker");
	var now = new Date();
	$datepicker.datepicker({
		defaultDate : now,
		dateFormat : 'DD MM dd, yy',
		showButtonPanel : true
	}).val($.datepicker.formatDate('DD MM dd, yy', now)).datepicker("hide")
			.change(function() {
				refreshPage();
			});

	$(document).on(
			"click",
			".ui-datepicker-buttonpane button.ui-datepicker-current",
			function() {
				$datepickerField.datepicker("setDate", new Date()).datepicker(
						"hide").trigger("change").blur();
			})

	var $entryInput = $("#input0");

	$entryInput.off("focus");
	$entryInput.off("click");
	$entryInput.on("focus", clearDefaultLoginText);
	$entryInput.on("click", clearDefaultLoginText);

	$entryInput.keyup(function(e) {
		if (e.keyCode == 13) {
			processInput(false);
		}
	});
	$("#taginput").submit(function() {
		processInput(false);
		return false;
	});

	var $entryArea = $("#entry0");
	$entryArea.listable({
		cancel : 'a, input, li.entry.ghost'
	});
	$entryArea.off("listableselected");
	/*$entryArea.off("listableunselecting");
	$entryArea.on("listableunselecting", function(e, ui) {
		var $unselectee = $("#" + ui.unselecting.id);
		unselecting($unselectee);
	});*/
	$entryArea.on("listableselected", function(e, ui) {
		var $selectee = $("#" + ui.selected.id);
		console.log("Select event triggered");
		selected($selectee, false);
	});

	$(document).on("click", "li.entry.ghost", function(e) {
		if (e.target.nodeName && $(e.target).closest("a,img").length) {
			// Not doing anything when delete icon clicked like 'cancel' option
			// in selectable.
			return false;
		}
		activateEntry($(this));
	})

	var cache = getAppCacheData('users');

	if (cache && isLoggedIn()) {
		setPeopleData(cache);
		initAutocomplete();
		refreshPage();
		return;
	}

	if (isOnline())
		$.getJSON(
			makeGetUrl("getPeopleData"),
			makeGetArgs(getCSRFPreventionObjectMobile("getPeopleDataCSRF")),
			function(data) {
				if (!checkData(data))
					return;				
				setAppCacheData("users", data);
				setPeopleData(data);
				// wait to init autocomplete until after login
				initAutocomplete();
				refreshPage();
			}
		);
}

// Overriding autocomplete from autocomplete.js

initAutocomplete = function() {
	$.retrieveJSON(makeGetUrl("autocompleteData"),
			getCSRFPreventionObjectMobile("autocompleteDataCSRF", {
				all : 'info'
			}), function(data, status) {
				if (checkData(data, status)) {
					tagStatsMap.import(data['all']);
					algTagList = data['alg'];
					freqTagList = data['freq'];

					var inputField = $("#input0");

					inputField.autocomplete({
						minLength : 1,
						attachTo : "#autocomplete",
						source : function(request, response) {
							var term = request.term.toLowerCase();

							var skipSet = {};
							var result = [];

							var matches = findAutoMatches(tagStatsMap,
									algTagList, term, 3, skipSet, 1);

							addStatsTermToSet(matches, skipSet);
							appendStatsTextToList(result, matches);

							var remaining = 6 - matches.length;

							if (term.length == 1) {
								var nextRemaining = remaining > 3 ? 3
										: remaining;
								matches = findAutoMatches(tagStatsMap,
										algTagList, term, nextRemaining,
										skipSet, 0);
								addStatsTermToSet(matches, skipSet);
								appendStatsTextToList(result, matches);
								remaining -= nextRemaining;
							}

							if (remaining > 0) {
								matches = findAutoMatches(tagStatsMap,
										freqTagList, term, remaining, skipSet,
										0);
								appendStatsTextToList(result, matches);
							}

							var obj = new Object();
							obj.data = result;
							response(result);
						},
						selectcomplete : function(event, ui) {
							var tagStats = tagStatsMap
									.getFromText(ui.item.value);
							if (tagStats) {
								var range = tagStats.getAmountSelectionRange();
								inputField.selectRange(range[0], range[1]);
								inputField.focus();
							}
						}
					});
					// open autocomplete on focus
					inputField.focus(function() {
						inputField.autocomplete("search", $("#input0").val());
					});
				}
			});
}