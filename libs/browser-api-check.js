/*global browser,chrome*/

const hasBrowserObject = (typeof browser !== 'undefined');
const hasChromeObject = (typeof chrome !== 'undefined');

function isWebExtensionCompatible() {
	return !!(
		hasBrowserObject &&
		browser.proxy &&
		browser.proxy.onRequest &&
		browser.proxy.onRequest.addListener
	);
}

function isChromeCompatible() {
	return !!(
		hasChromeObject &&
		chrome.proxy &&
		chrome.proxy.settings &&
		chrome.proxy.settings.get && chrome.proxy.settings.set
	);
}