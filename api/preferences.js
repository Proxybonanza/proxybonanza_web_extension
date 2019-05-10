'use strict';

/**
 * alias of browser.storage.local.get
 *
 * @returns {Promise}
 */
function getPreferences(items) {
	return browser.storage.local.get(items);
}

/**
 * alias of browser.storage.local.set
 *
 * @returns {Promise}
 */
function setPreferences(items) {
	return browser.storage.local.set(items);
}