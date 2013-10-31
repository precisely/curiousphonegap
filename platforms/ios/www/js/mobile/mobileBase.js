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
		modal: true,
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