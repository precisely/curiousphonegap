function showAlert(alertText) {
	$("#alert-message-text").text(alertText);
	$("#alert-message").dialog({
		dialogClass: "no-close",
		modal: true,
		resizable: false,
		title: "Alert",
		buttons: {
			Ok: function() {
				$( this ).dialog( "close" );
			}
		}
	});
}

function showYesNo(alertText, onConfirm) {
	$("#alert-message-text").text(alertText);
	$("#alert-message").dialog({
		dialogClass: "no-close",
		modal: false,
		resizable: false,
		title: "Query",
		buttons: {
			"Yes ": function() {
				$( this ).dialog( "close" );
				onConfirm();
			},
			No: function() {
				$( this ).dialog( "close" );
			}
		}
	});
}

function showAB(alertText, aText, bText, onA, onB) {
	$("#alert-message-text").text(alertText);
	var buttons = {};
	buttons[aText + " "] = function() {
		onA();
		$( this ).dialog( "close" );
	};
	buttons[bText] = function() {
		onB();
		$( this ).dialog( "close" );
	};
	$("#alert-message").dialog({
		dialogClass: "no-close",
		modal: false,
		resizable: false,
		title: "Query",
		buttons: buttons
	});
}
