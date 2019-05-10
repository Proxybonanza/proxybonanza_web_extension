'use strict';

/**
 * Expose addon version when visiting proxybonanza.com website
 *
 * @url https://proxybonanza.com/auto/show_my_ip
 */
browser.webRequest.onBeforeSendHeaders.addListener(data=> {
	data.requestHeaders.push({
		name: 'X-Proxybonanza-Addon-Version', value: browser.runtime.getManifest().version
	});
	return {requestHeaders: data.requestHeaders};
}, {
	urls: [
		'*://proxybonanza.com/*',//live server
		'*://*.proxybonanza.com/*',//live server
		'*://*.local.webdev20.pl/*',//test server #1
		'*://*.pbnza.net/*'//test server #2
	]
}, ['blocking', 'requestHeaders']);