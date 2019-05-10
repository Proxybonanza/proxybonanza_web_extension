'use strict';
function utf8_to_base64(str) {
	return window.btoa(unescape(encodeURIComponent(str)));
}

function strpos(haystack, needle, offset) {
	var i = (haystack + '').indexOf(needle, (offset || 0));
	return i === -1 ? false : i;
}

function stripos(haystack, needle, offset) {
	return strpos((haystack + '').toLowerCase(), (needle + '').toLowerCase(), offset);
}

function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (decodeURIComponent(pair[0]) === variable) {
			return decodeURIComponent(pair[1]);
		}
	}
	return undefined;
}