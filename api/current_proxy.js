'use strict';
/*global URL,browser,chrome*/

async function getPrefersSocksOverHttp() {
	const sockProxyPriority = await getPreference('sockProxyPriority');
	return sockProxyPriority === undefined ? 0 : sockProxyPriority;
}

/**
 * Disables current proxy
 *
 * @event current_proxy_changed
 * @returns {Promise}
 */
async function disableCurrentProxy() {
	if (isWebExtensionCompatible()) {
		return disableCurrentProxyWebExt();
	}
	if (isChromeCompatible()) {
		return disableCurrentProxyChrome();
	}
	return Promise.reject();
}

async function disableCurrentProxyWebExt() {
	const window = await getBackgroundPage();
	window.currentProxyCacheWrite({});
	trigger('current_proxy_changed', {});
	return Promise.resolve({});
}

async function disableCurrentProxyChrome() {
	return new Promise(resolve=> {
		chrome.proxy.settings.set({value: {mode: 'direct'}, scope: 'regular'}, ()=> {
			resolve(disableCurrentProxyWebExt());
		});
	});
}

/**
 * Enables proxy identified by given proxy_id
 *
 * @event current_proxy_changed
 * @param proxy_id
 * @returns {Promise}
 */
async function setCurrentProxy(proxy_id) {
	return applyCurrentProxy(await getProxy(proxy_id));
}

/**
 * Enabled given proxy
 *
 * @event current_proxy_changed
 * @param proxy
 * @returns {Promise}
 */
async function applyCurrentProxy(proxy) {
	if (isWebExtensionCompatible()) {
		return applyCurrentProxyWebExt(proxy);
	}
	if (isChromeCompatible()) {
		return applyCurrentProxyChrome(proxy);
	}
	return Promise.reject();
}

async function applyCurrentProxyWebExt(proxy) {
	const window = await getBackgroundPage();
	window.currentProxyCacheWrite(proxy);
	if (proxy.ip) {
		window.lastEnabledProxyCacheWrite(proxy);
	}
	trigger('current_proxy_changed', proxy);
	return window.currentProxyCacheRead();
}

async function applyCurrentProxyChrome(proxy) {
	const sockProxyPriority = await getPreference('sockProxyPriority');
	const prefer_socks_over_http = await getPrefersSocksOverHttp();
	let config = {
		mode: 'fixed_servers',
		rules: {}
	};

	if (proxy.socksport) {
		const socksConfig = {
			scheme: 'socks5',
			host: proxy.ip,
			port: parseInt(proxy.socksport, 10)
		};
		if (prefer_socks_over_http || !proxy.httpport) {
			config.rules.proxyForHttp = socksConfig;
			config.rules.proxyForHttps = socksConfig;
		}
		if (!prefer_socks_over_http || !proxy.httpport) {
			config.rules.fallbackProxy = socksConfig;
		}
	}
	if (proxy.httpport) {
		const httpConfig = {
			scheme: 'http',
			host: proxy.ip,
			port: parseInt(proxy.httpport, 10)
		};
		if (!prefer_socks_over_http || !proxy.socksport) {
			config.rules.proxyForHttp = httpConfig;
			config.rules.proxyForHttps = httpConfig;
		}
		if (prefer_socks_over_http || !proxy.socksport) {
			config.rules.fallbackProxy = httpConfig;
		}
	}
	const window = await getBackgroundPage();
	if (!proxy.socksport && !proxy.httpport) {
		config = {mode: 'direct'};
		window.currentProxyCacheWrite({});
	} else {
		window.currentProxyCacheWrite(proxy);
		window.lastEnabledProxyCacheWrite(proxy);
	}
	const current_proxy = await window.currentProxyCacheRead();
	return new Promise(resolve=> {
		chrome.proxy.settings.set({value: config, scope: 'regular'}, ()=> {
			trigger('current_proxy_changed', current_proxy);
			resolve(current_proxy);
		});
	});
}

/**
 * Returns currently enabled proxy object
 * If no proxy is currently enabled empty object will be returned instead
 *
 * @returns {Promise}
 */
async function getCurrentProxy() {
	if (isWebExtensionCompatible()) {
		return getCurrentProxyWebExt();
	}
	if (isChromeCompatible()) {
		return getCurrentProxyChrome();
	}
	return Promise.reject();
}

async function getCurrentProxyWebExt() {
	const window = await getBackgroundPage();
	return await window.currentProxyCacheRead();
}

async function getCurrentProxyChrome() {
	const current_proxy = await getCurrentProxyWebExt();
	return new Promise(resolve=> {
		chrome.proxy.settings.get({'incognito': false}, config=> {
			if (!config.value || config.value.mode !== 'fixed_servers') {
				resolve({});
			} else {
				const proxyParse = proxyConfig=> {
					if (proxyConfig && proxyConfig.scheme) {
						if (proxyConfig.scheme == 'http') {
							return {
								ip: proxyConfig.host,
								httpport: proxyConfig.port
							};
						}
						if (proxyConfig.scheme == 'socks5') {
							return {
								ip: proxyConfig.host,
								socksport: proxyConfig.port
							};
						}
					}
					return {};
				};

				const proxyForHttp = proxyParse(config.value.rules.proxyForHttp);
				const fallbackProxy = proxyParse(config.value.rules.fallbackProxy);
				let rawProxy = proxyForHttp;
				if (proxyForHttp.ip == fallbackProxy.ip) {
					rawProxy = Object.assign({}, fallbackProxy, proxyForHttp);
				}

				if (rawProxy.ip && current_proxy && current_proxy.ip == rawProxy.ip) {
					resolve(current_proxy);
				}

				return getProxies().then(proxies=> {
					resolve(
						Object.freeze(
							Object.assign({},
								proxies.find(proxy=> {
									return !(
										proxy.ip !== rawProxy.ip ||
										rawProxy.httpport && proxy.httpport !== rawProxy.httpport ||
										rawProxy.socksport && proxy.socksport !== rawProxy.socksport
									);
								}) || rawProxy
							)
						)
					);
				});
			}
		});
	});
}

/**
 * Returns last enabled proxy object
 * Returns empty object if no proxy was enabled since startup
 *
 * @returns {Promise}
 */
async function getLastEnabledProxy() {
	const window = await getBackgroundPage();
	return await window.lastEnabledProxyCacheRead();
}

/**
 * Switches on first proxy from proxylist
 * Returns rejected promise if proxylist is empty
 *
 * @event current_proxy_changed
 * @returns {Promise}
 */
async function enableFirstProxy() {
	const proxies = await getProxies();
	if (proxies.length) {
		return applyCurrentProxy(proxies[0]);
	} else {
		notifyError(__('message_proxylist_is_empty'));
		return Promise.reject()
	}
}

/**
 * Switches on last proxy on proxylist
 * Returns rejected promise if proxylist is empty
 *
 * @event current_proxy_changed
 * @returns {Promise}
 */
async function enableLastProxy() {
	const proxies = await getProxies();
	if (proxies.length) {
		return applyCurrentProxy(proxies[proxies.length - 1]);
	} else {
		notifyError(__('message_proxylist_is_empty'));
		return Promise.reject()
	}
}

/**
 * Disables current proxy or enables last enabled proxy
 * If no proxy was enabled since startup calls enableFirstProxy() is called instead
 *
 * @returns {Promise}
 */
async function toogleLastProxy() {
	const current_proxy = await getCurrentProxy();
	if (current_proxy.ip) {
		return disableCurrentProxy();
	} else {
		const last_enabled_proxy = await getLastEnabledProxy();
		if (last_enabled_proxy.ip) {
			return applyCurrentProxy(last_enabled_proxy);
		} else {
			return enableFirstProxy();
		}
	}
}

/**
 * Switches to the next proxy on proxylist
 * If no proxy was enabled since startup enableFirstProxy() is called instead
 *
 * @returns {Promise}
 */
async function enableNextProxy() {
	const current_proxy = await getCurrentProxy();
	if (!current_proxy.id) {
		return enableFirstProxy();
	} else {
		const proxies = await getProxies();
		if (!proxies.length) {
			notifyError(__('message_proxylist_is_empty'));
			return Promise.reject()
		}
		const idx = proxies.findIndex(proxy=>proxy.id === current_proxy.id);
		switch (idx) {
			case -1:
			case proxies.length - 1:
				return applyCurrentProxy(proxies[0]);
			default:
				return applyCurrentProxy(proxies[idx + 1]);
		}
	}
}

/**
 * Switches to the previous proxy on proxylist
 * If no proxy was enabled since startup enableLastProxy() is called instead
 *
 * @returns {Promise}
 */
async function enablePrevProxy() {
	const current_proxy = await getCurrentProxy();
	if (!current_proxy.id) {
		return enableLastProxy();
	} else {
		const proxies = await getProxies();
		if (!proxies.length) {
			notifyError(__('message_proxylist_is_empty'));
			return Promise.reject()
		}
		const idx = proxies.findIndex(proxy=>proxy.id === current_proxy.id);

		switch (idx) {
			case -1:
			case 0:
				return applyCurrentProxy(proxies[proxies.length - 1]);
			default:
				return applyCurrentProxy(proxies[idx - 1]);
		}
	}
}

async function handleProxyRequestWebExt(requestInfo) {
	console.log('requestInfo', requestInfo);
	const url = new URL(requestInfo.url);
	if (url.host == 'localhost' || requestInfo.ip == '127.0.0.1' || requestInfo.ip == '::1') {
		return {type: 'direct'};
	}
	const current_proxy = await getCurrentProxy();
	if (!current_proxy.ip) {
		return {type: 'direct'};
	}

	const prefer_socks_over_http = await getPrefersSocksOverHttp();
	const proxyInfo = [];

	if (current_proxy.httpport && !prefer_socks_over_http) {
		proxyInfo.push({
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
		proxyInfo.push(proxySpec);
	}

	if (current_proxy.httpport && prefer_socks_over_http) {
		proxyInfo.push({
			type: 'http',
			host: current_proxy.ip,
			port: current_proxy.httpport,
		});
	}

	return proxyInfo;
}

if (isWebExtensionCompatible()) {
	browser.proxy.onRequest.addListener(handleProxyRequestWebExt, {urls: ["<all_urls>"]});
}

if (chrome && chrome.proxy && chrome.proxy.onProxyError && chrome.proxy.onProxyError.addListener) {
	chrome.proxy.onProxyError.addListener(error => {
		console.error('Proxy error: ' + (error.message || error.error), error);
	});
}