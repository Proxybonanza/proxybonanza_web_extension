'use strict';

window.proxyCache = {
	current_proxy: {},
	last_enabled_proxy: {},
};


function currentProxyCacheWrite(proxy) {
	proxy = Object.freeze(Object.assign({}, proxy || {}));
	window.proxyCache.current_proxy = proxy;
	return Promise.resolve(proxy);
}

function currentProxyCacheRead() {
	return Promise.resolve(window.proxyCache.current_proxy);
}

function lastEnabledProxyCacheWrite(last_enabled_proxy) {
	last_enabled_proxy = Object.freeze(Object.assign({}, last_enabled_proxy || {}));
	window.proxyCache.last_enabled_proxy = last_enabled_proxy;
	return Promise.resolve(last_enabled_proxy);
}

function lastEnabledProxyCacheRead() {
	return Promise.resolve(window.proxyCache.last_enabled_proxy);
}

/**
 * Refreshes all opened tabs
 */
function refreshAllTabs() {
	browser.tabs.query({}).then(tabs=> {
		tabs.forEach(tab=> {
			if (!tab.discarded) {
				const protocol = tab.url.split(':')[0];
				if (['http', 'https', 'ftp'].includes(protocol)) {
					browser.tabs.reload(tab.id, {bypassCache: true});
				}
			}
		})
	});
}
/**
 * Implementation of autoRefresh preference
 * Refreshes all tabs after changing proxy if enabled
 */
$(document).on('current_proxy_changed', (e, current_proxy, sender)=> {
	if (current_proxy.ip) {
		getPreference('autoRefresh').then(autoRefresh=> {
			if (autoRefresh) {
				refreshAllTabs();
			}
		})
	}
});