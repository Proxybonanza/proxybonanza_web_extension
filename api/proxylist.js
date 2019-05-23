'use strict';

/**
 * Returns list of stored proxies
 * Returns empty array if no proxies were stored
 *
 * @returns {Promise}
 */
function getProxies() {
	return browser.storage.local.get('proxies').then(result=>result.proxies || []);
}

/**
 * Returns stored proxy object by a given proxy_id
 * Returns rejected promise if no stored proxy with a given proxy_id is found
 *
 * @returns {Promise}
 */
async function getProxy(proxy_id) {
	if (!proxy_id || proxy_id == '') {
		return Promise.reject();
	}
	const proxies = await getProxies();
	return proxies.find(proxy=>proxy.id === proxy_id) || Promise.reject();
}

/**
 * Save array of proxy objects into local storage
 *
 * @param {Array} proxies_to_save
 * @returns {Promise}
 */
async function saveProxies(proxies_to_save) {
	const tmp = {};
	proxies_to_save.forEach(proxy_to_save=> {
		tmp[proxy_to_save.id] = proxy_to_save;
	});
	const proxies = await getProxies();
	proxies.forEach(proxy=> {
		if ('id' in proxy) {
			Object.assign(proxy, tmp[proxy.id]);
			delete tmp[proxy.id];
		}
	});
	Object.values(tmp).forEach(proxy_to_save=> {
		proxies.push(proxy_to_save);
	});
	return browser.storage.local.set({'proxies': proxies});
}

/**
 * Save single proxy object into local storage
 *
 * @param proxy_to_save
 * @returns {Promise}
 */
function saveProxy(proxy_to_save) {
	return saveProxies([proxy_to_save]);
}

/**
 * Remove proxy with a given proxy_id from a local storage
 *
 * @param proxy_id
 * @returns {Promise}
 */
async function deleteProxy(proxy_id) {
	const proxies = await getProxies();
	return browser.storage.local.set({'proxies': proxies.filter(proxy=>proxy.id != proxy_id)});
}

/**
 * Remove all proxies from a local storage
 *
 * @returns {Promise}
 */
function deleteAllProxies() {
	return browser.storage.local.set({'proxies': []});
}