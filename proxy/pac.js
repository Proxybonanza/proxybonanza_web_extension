/* exported FindProxyForURL */
/**
 * Current proxy object
 * Empty object means direct connection
 */
let current_proxy = {};

/**
 * Last enabled proxy object
 * Empty object no proxy was enabled sice startup
 */
let last_enabled_proxy = {};


/**
 * Shoud sock proxes be prefered over http proxies
 * @type {number} 0|1
 */
let prefer_socks_over_http = 1;

/**
 * Returns proxy specification of
 * @returns {Array|String}
 */
function getProxySpec() {
	if (current_proxy.ip) {
		const proxySpecification = [];

		if (current_proxy.httpport && !prefer_socks_over_http) {
			proxySpecification.push({
				type: 'http',
				host: current_proxy.ip,
				port: current_proxy.httpport,
			});
		}

		if (current_proxy.socksport) {
			const proxySpec = {
				type: 'socks',
				host: current_proxy.ip,
				port: current_proxy.socksport,
				proxyDNS: true
			};
			if (current_proxy.username) {
				proxySpec.username = current_proxy.username;
				proxySpec.password = current_proxy.password || '';
			}
			proxySpecification.push(proxySpec);
		}

		if (current_proxy.httpport && prefer_socks_over_http) {
			proxySpecification.push({
				type: 'http',
				host: current_proxy.ip,
				port: current_proxy.httpport,
			});
		}

		return proxySpecification;
	} else {
		return 'DIRECT';
	}
}

function FindProxyForURL(url, host) {
	if (host == 'localhost' || host == '127.0.0.1') {
		return 'DIRECT';
	} else {
		return getProxySpec();
	}
}

/**
 * Lissens to the incoming messages and react to them
 *
 * @param message
 * @param sender Object
 * @param sendResponse function
 */
function messageHandler(message, sender, sendResponse) {
	switch (message.event) {
		case 'disable_current_proxy':
			current_proxy = {};
			sendResponse(current_proxy);
			browser.runtime.sendMessage({
				event: 'current_proxy_changed',
				data: current_proxy
			});
			break;
		case 'set_current_proxy':
			current_proxy = message.data || {};
			if (current_proxy.ip) {
				last_enabled_proxy = current_proxy;
			}
			sendResponse(current_proxy);
			browser.runtime.sendMessage({
				event: 'current_proxy_changed',
				data: current_proxy
			});
			break;
		case 'get_current_proxy':
			sendResponse(current_proxy);
			break;
		case 'get_last_enabled_proxy':
			sendResponse(last_enabled_proxy);
			break;
		case 'prefer_socks_over_http':
			prefer_socks_over_http = message.data;
			sendResponse(prefer_socks_over_http);
			break;
	}
}
browser.runtime.onMessage.addListener(messageHandler);
