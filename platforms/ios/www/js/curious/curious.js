// Base Curious functionality

/*
 * Raw browser state/capability queries
 */
function isOnline() {
	return window.navigator.onLine;
}

function supportsLocalStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

/*
 * Logout callbacks; register callbacks to be called when user logs out
 */
var logoutCallbacks = [];

function registerLogoutCallback(closure) {
	logoutCallbacks.push(closure);
}

function callLogoutCallbacks() {
	for (var i in logoutCallbacks) {
		logoutCallbacks[i]();
	}
}

/*
 * Simple dump methods
 */
/*
var MAX_DUMP_DEPTH = 10;

function dumpObj(obj) {
	return dumpInternalObj(obj, "", "", 0);
}

function dumpInternalObj(obj, name, indent, depth) {
	if (depth > MAX_DUMP_DEPTH) {
		return indent + name + ": <Maximum Depth Reached>\n";
	}
	if (typeof obj == "object") {
		var child = null;
		var output = indent + name + "\n";
		indent += "\t";
		for (var item in obj) {
			try {
				child = obj[item];
			} catch (e) {
				child = "<Unable to Evaluate>";
			}
			if (typeof child == "object") {
				output += dumpInternalObj(child, item, indent, depth + 1);
			} else {
				output += indent + item + ": " + child + "\n";
			}
		}
		return output;
	} else {
		return obj;
	}
}
*/

/*
 * jQuery extensions
 */
$.fn.setAbsolute = function(options) {
	return this.each(function() {
		var el = $(this);
		var pos = el.position();
		settings = jQuery.extend({
			x: pos.left,
			y: pos.top,
			rebase: false
		}, options);
		el.css({ position: "absolute",
			marginLeft: 0, marginTop: 0,
			top: settings.y, left: settings.x });
		if (settings.rebase)
			el.remove().appendTo("body");
	});
}

$.fn.isUnderEvent = function(e) {
	var pos = this.position();
	if (!pos) return false;
	var height = this.height();
	var width = this.width();
	
	return e.pageX >= pos.left && e.pageX < pos.left + width
			&& e.pageY >= pos.top && e.pageY < pos.top + height;
}

$.fn.selectRange = function(start, end) {
    return this.each(function() {
        if(this.setSelectionRange) {
            this.focus();
            this.setSelectionRange(start, end);
        } else if(this.createTextRange) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveEnd('character', end);
            range.moveStart('character', start);
            range.select();
        }
    });
};

$.extend({
	   postJSON: function( url, data, callback) {
	      return jQuery.post(url, data, callback, "json");
	   }
	});

/*
 * HTML escape utility methods
 */
function escapehtml(str) {
	return (''+str).replace(/&/g,'&amp;').replace(/>/g,'&gt;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/  /g,'&nbsp;&nbsp;');
}

function addslashes(str) {
	return str.replace(/\'/g,'\\\'').replace(/\"/g,'\\"')
			.replace(/\\/g,'\\\\').replace(/\0/g,'\\0');
}

/*
 * Text field highlighting methods
 */
function resetTextField(field) {
	if (!field.data('textFieldAlreadyReset')) {
		field.css('color','#000000');
		field.val(''); 
		field.data('textFieldAlreadyReset', true);
	}
}

function initTextField(field, initText) {
	field.css('color','#cccccc');
	field.val(initText); 
	field.data('textFieldAlreadyReset', false);
}

function setDateField(field, date, init) {
	if (date == null) {
		initTextField(field, init);
	} else {
		resetTextField(field);
		field.datepicker('setDate', date);
	}
}

function formatAmount(amount, amountPrecision) {
	if (amount == null) return " ___";
	if (amountPrecision < 0) return "";
	if (amountPrecision == 0) {
		return amount ? " yes" : " no";
	}
	return " " + amount;
}

function formatUnits(units) {
	if (units.length > 0)
		return " " + units;
	
	return "";
}

/*
 * Curious data json return value check
 */
function checkData(data, status, errorMessage, successMessage) {
	if (data == 'error') {
		if (errorMessage && status != 'cached')
			alert(errorMessage);
		return false;
	}
	if (data == 'login') {
		if (status != 'cached') {
			alert("Session timed out.");
			doLogout();
			location.reload(true);
		}
		return false;
	}
	if (data == 'success') {
		if (successMessage && status != 'cached')
			alert(successMessage);
		return true;
	}
	if (typeof(data) == 'string') {
		if (status != 'cached') {
			alert(data);
			location.reload(true);
		}
		return false;
	}
	return true;
}

/*
 * Curious user id/name methods
 */
var currentUserId;
var currentUserName;

function setUserId(userId) {
	if (userId == undefined) return; // don't change if undefined
	if (userId != currentUserId) {
		var oldUserId = currentUserId;
		currentUserId = userId;
		if (oldUserId) // don't refresh page on first page load
			refreshPage();
	}
}

function setUserName(userName) {
	if (userName == undefined) return; // don't change if undefined
	if (userName != currentUserName) {
		currentUserName = userName;
	}
}
