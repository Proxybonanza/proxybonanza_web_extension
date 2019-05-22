'use strict';

/**
 * alias of browser.storage.local.get
 *
 * @returns {Promise}
 */
async function getPreferences(items) {
	return browser.storage.local.get(items);
}

async function getPreference(item) {
	const preferences = await getPreferences(item);
	return preferences[item];
}

/**
 * alias of browser.storage.local.set
 *
 * @returns {Promise}
 */
async function setPreferences(items) {
	return browser.storage.local.set(items);
}