'use strict';
/**
 * Implementation of sockProxyPriority preference for WebExtensions
 * @param newValue
 */

function applyProxyPrority(newValue) {
	if (newValue === undefined) {
		newValue = 0;
	} else {
		newValue = parseInt(newValue, 10);
	}
	pacReady(
		()=>browser.runtime.sendMessage(
			{
				event: 'prefer_socks_over_http',
				data: newValue,
			},
			{
				toProxyScript: true
			}
		),
		()=> {
		}//Nothing to do here. No pac script in google chrome.
		// Implementation of sockProxyPriority for chrome already hardcoded inside applyCurrentProxy() fallback
	);
}

/**
 * Send sockProxyPriority value to a pac script
 */
getPreferences('sockProxyPriority').then(preferences=> {
	applyProxyPrority(preferences.sockProxyPriority);
});

/**
 * Sends sockProxyPriority value to a pac script when
 */
$(document).on('sockProxyPriority_changed', (e, change)=> {
	applyProxyPrority(change.newValue)
});