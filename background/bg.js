'use strict';

window.pac_ready = browser.proxy.register ? browser.proxy.register('/proxy/pac.js') : false;
window.chromeProxyFallbackCache = {};

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
		getPreferences('autoRefresh').then(preferences=> {
			if (preferences.autoRefresh) {
				refreshAllTabs();
			}
		})
	}
});