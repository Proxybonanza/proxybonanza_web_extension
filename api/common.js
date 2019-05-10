'use strict';

/**
 * alias of browser.runtime.getBackgroundPage
 *
 * @returns {Promise}
 */
function getBackgroundPage() {
	return browser.runtime.getBackgroundPage();
}

/**
 * Opens proxybonanza manager UI in sidebar
 * Closes sidebar if already open
 * Returns failed promise if sidebarAction is not supported
 *
 * @returns {Promise}
 */
function openProxybonanzaSidebar() {
	if (window.browser && browser.sidebarAction && browser.sidebarAction.open) {
		if (browser.sidebarAction.isOpen && browser.sidebarAction.isOpen()) {
			return browser.sidebarAction.close();
		}
		return browser.sidebarAction.open();
	}
	return Promise.reject();
}

/**
 * Opens proxybonanza manager UI in popup
 * Returns failed promise if openPopup is not supported
 *
 * @returns {Promise}
 */
function openProxybonanzaPopup() {
	if (browser.browserAction && browser.browserAction.openPopup) {
		return browser.browserAction.openPopup();
	}
	return Promise.reject();
}

/**
 * Opens url in new tab
 *
 * @returns {Promise}
 */
function openInNewTab(url) {
	return browser.tabs.create({
		active: true,
		url: url
	});
}

/**
 * Opens proxybonanza manager UI in new tab
 * Should work on all browsers
 *
 * @returns {Promise}
 */
function openProxybonanzaTab() {
	return openInNewTab('page_proxylist.html');
}

/**
 * Opens proxybonanza manager UI
 * UI is opened in sidebar, popup or new tab
 * depending on the browser support
 *
 * @returns {Promise}
 */
function openProxyManager() {
	return openProxybonanzaSidebar()
		.catch(openProxybonanzaPopup)
		.catch(openProxybonanzaTab);
}