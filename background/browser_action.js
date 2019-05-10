'use strict';

/**
 * Updates browserAction button when current proxy is changed
 *
 * @param current_proxy
 */
function updateToolbarButton(current_proxy) {
	let label, icon;
	if (current_proxy.ip) {
		label = 'Proxybonanza Manager - Connected via ' + current_proxy.ip;
		if (current_proxy.countrycode) {
			if (current_proxy.label) label += ' [' + current_proxy.label + ',' + current_proxy.countrycode + ']';
		} else {
			if (current_proxy.label) label += ' [' + current_proxy.label + ']';
		}

		if (current_proxy.countrycode) {
			icon = '/img/flags/' + current_proxy.countrycode.toLowerCase() + '.png';
		} else {
			icon = '/img/flags/unknown.png';
		}
	} else {
		label = 'Proxybonanza Manager - Direct Connection';
		icon = '/img/ico_logo.png';
	}
	//browser.browserAction.setIcon({path:icon});
	browser.browserAction.setTitle({title: label});
	browser.browserAction.setBadgeText({text: current_proxy.countrycode || ''});
}

$(document).on('current_proxy_changed', (e, current_proxy, sender)=> {
	updateToolbarButton(current_proxy);
});

getCurrentProxy().then(updateToolbarButton);

/**
 * browserAction button should open/close proxy manager gui when clicked
 */
browser.browserAction.onClicked.addListener(tab=> {
	openProxyManager();
});