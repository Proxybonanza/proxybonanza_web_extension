'use strict';
/*global browser,chrome*/

/**
 * Intercepts HTTP proxy authentication request to automatically provide username & password to a known proxy servers
 */

const pendingRequests = [];

function requestCompleted(requestDetails) {
	const index = pendingRequests.indexOf(requestDetails.requestId);
	if (index > -1) {
		pendingRequests.splice(index, 1);
	}
}

function provideCredentials(requestDetails) {
	return new Promise(resolve=> {
		if (pendingRequests.indexOf(requestDetails.requestId) != -1) {
			resolve({cancel: true});
		} else {
			pendingRequests.push(requestDetails.requestId);
			return getCurrentProxy().then(proxy=> {
				if (
					requestDetails.challenger.host == proxy.ip &&
					requestDetails.challenger.port == proxy.httpport &&
					proxy.username
				) {
					resolve({
						authCredentials: {
							username: proxy.username,
							password: proxy.password
						}
					});
				} else {
					resolve();
				}
			});
		}
	});
}

if (isWebExtensionCompatible()) {
	browser.webRequest.onAuthRequired.addListener(
		provideCredentials,
		{urls: ['<all_urls>']},
		['blocking']
	);
} else if (isChromeCompatible()) {
	chrome.webRequest.onAuthRequired.addListener(
		(requestDetails, chromeCallback)=>provideCredentials(requestDetails).then(result=>chromeCallback(result)),
		{urls: ['<all_urls>']},
		['asyncBlocking']
	);
}


browser.webRequest.onCompleted.addListener(
	requestCompleted,
	{urls: ['<all_urls>']}
);

browser.webRequest.onErrorOccurred.addListener(
	requestCompleted,
	{urls: ['<all_urls>']}
);