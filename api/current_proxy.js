'use strict';

chrome.proxy.onProxyError.addListener(error => {
	console.error('Proxy error: ', error.message, error);
});

/**
 * Cache object needed for chrome.proxy fallback implementation
 * Not used when browser.proxy api is in use
 *
 * @type {{current_proxy: undefined|Object, last_enabled_proxy: undefined|Object}}
 */
var chromeProxyFallbackCache = {};

/**
 * Waits for pac.js ready event and then calls webExtImplementation
 * If pac script loading is not supported calls chromeFallbackImplementation instead
 *
 * @param {Promise} webExtImplementation
 * @param {Promise} chromeFallbackImplementation
 * @returns {Promise}
 */
function pacReady(webExtImplementation, chromeFallbackImplementation) {
	return getBackgroundPage().then(window=> {
		if (window.pac_ready) {
			return window.pac_ready.then(webExtImplementation)
		} else {
			return chromeFallbackImplementation(window.chromeProxyFallbackCache)
		}
	});
}

/**
 * Disables current proxy
 *
 * @event current_proxy_changed
 * @returns {Promise}
 */
function disableCurrentProxy() {
	return pacReady(
		()=> {
			return browser.runtime.sendMessage(
				{
					event: 'disable_current_proxy',
				},
				{
					toProxyScript: true
				}
			);
		},
		chromeProxyFallbackCache=> {
			//google chrome compatible fallback
			return new Promise(resolve=> {
				chrome.proxy.settings.set({value: {mode: 'direct'}, scope: 'regular'}, ()=> {
					chromeProxyFallbackCache.current_proxy = {};
					chrome.runtime.sendMessage({
						event: 'current_proxy_changed',
						data: {}
					});
					$(document).trigger('current_proxy_changed', chromeProxyFallbackCache.current_proxy);
					resolve(chromeProxyFallbackCache.current_proxy);
				});
			});
		}
	);
}

/**
 * Enables proxy idetified by given proxy_id
 *
 * @event current_proxy_changed
 * @param proxy_id
 * @returns {Promise}
 */
function setCurrentProxy(proxy_id) {
	return getProxy(proxy_id).then(proxy=>applyCurrentProxy(proxy));
}

/**
 * Enabled given proxy
 *
 * @event current_proxy_changed
 * @param proxy
 * @returns {Promise}
 */
function applyCurrentProxy(proxy) {
	return pacReady(
		()=> {
			return browser.runtime.sendMessage(
				{
					event: 'set_current_proxy',
					data: proxy,
				},
				{
					toProxyScript: true
				}
			);
		},
		chromeProxyFallbackCache=> {
			//google chrome compatible fallback
			return new Promise(resolve=> {
				getPreferences('sockProxyPriority').then(preferences=> {
					const prefer_socks_over_http = preferences.sockProxyPriority === undefined ? 0 : preferences.sockProxyPriority;
					let config = {
						mode: "fixed_servers",
						rules: {}
					};

					if (proxy.socksport) {
						const socksConfig = {
							scheme: "socks5",
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
							scheme: "http",
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
					if (!proxy.socksport && !proxy.httpport) {
						config = {mode: 'direct'};
						chromeProxyFallbackCache.current_proxy = {};
					} else {
						chromeProxyFallbackCache.current_proxy = chromeProxyFallbackCache.last_enabled_proxy = proxy;
					}
					chrome.proxy.settings.set({value: config, scope: 'regular'}, ()=> {
						chrome.runtime.sendMessage({
							event: 'current_proxy_changed',
							data: chromeProxyFallbackCache.current_proxy
						});
						$(document).trigger('current_proxy_changed', chromeProxyFallbackCache.current_proxy);
						resolve(Object.assign({}, chromeProxyFallbackCache.current_proxy));
					});
				});
			});
		}
	);
}

/**
 * Returns currently enabled proxy object
 * If no proxy is currently enabled empty object will be returned instead
 *
 * @returns {Promise}
 */
function getCurrentProxy() {
	return pacReady(
		()=> {
			return browser.runtime.sendMessage(
				{
					event: 'get_current_proxy',
				},
				{
					toProxyScript: true
				}
			);
		},
		chromeProxyFallbackCache=> {
			//google chrome compatible fallback
			//return Promise.resolve(chromeProxyFallbackCache.current_proxy||{});
			return new Promise(resolve=> {
				chrome.proxy.settings.get({'incognito': false}, function (config) {
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

						if (rawProxy.ip && chromeProxyFallbackCache.current_proxy && chromeProxyFallbackCache.current_proxy.ip == rawProxy.ip) {
							resolve(chromeProxyFallbackCache.current_proxy);
						}

						return getProxies().then(proxies=> {
							resolve(
								proxies.find(proxy=> {
									return !(
										proxy.ip !== rawProxy.ip ||
										rawProxy.httpport && proxy.httpport !== rawProxy.httpport ||
										rawProxy.socksport && proxy.socksport !== rawProxy.socksport
									);
								}) || rawProxy
							);
						});
					}
				});
			});
		}
	);
}

/**
 * Returns last enabled proxy object
 * Returns empty object if no proxy was enabled since startup
 *
 * @returns {Promise}
 */
function getLastEnabledProxy() {
	return pacReady(
		()=> {
			return browser.runtime.sendMessage(
				{
					event: 'get_last_enabled_proxy',
				},
				{
					toProxyScript: true
				}
			);
		},
		chromeProxyFallbackCache=> {
			//google chrome compatible fallback
			return Promise.resolve(chromeProxyFallbackCache.last_enabled_proxy || {});
		}
	);
}

/**
 * Switches on first proxy from proxylist
 * Returns rejected promise if proxylist is empty
 *
 * @event current_proxy_changed
 * @returns {Promise}
 */
function enableFirstProxy() {
	return getProxies().then(proxies=> {
		if (proxies.length) {
			return applyCurrentProxy(proxies[0]);
		} else {
			notifyError(__('message_proxylist_is_empty'));
			return Promise.reject()
		}
	});
}

/**
 * Switches on last proxy on proxylist
 * Returns rejected promise if proxylist is empty
 *
 * @event current_proxy_changed
 * @returns {Promise}
 */
function enableLastProxy() {
	return getProxies().then(proxies=> {
		if (proxies.length) {
			return applyCurrentProxy(proxies[proxies.length - 1]);
		} else {
			notifyError(__('message_proxylist_is_empty'));
			return Promise.reject()
		}
	});
}

/**
 * Disables current proxy or enables last enabled proxy
 * If no proxy was enabled since startup calls enableFirstProxy() is called instead
 *
 * @returns {Promise}
 */
function toogleLastProxy() {
	return getCurrentProxy().then(current_proxy=> {
		if (current_proxy.ip) {
			return disableCurrentProxy();
		} else {
			return getLastEnabledProxy().then(last_enabled_proxy=> {
				if (last_enabled_proxy.ip) {
					return applyCurrentProxy(last_enabled_proxy);
				} else {
					return enableFirstProxy();
				}
			});
		}
	});
}

/**
 * Switches to the next proxy on proxylist
 * If no proxy was enabled since startup enableFirstProxy() is called instead
 *
 * @returns {Promise}
 */
function enableNextProxy() {
	return getCurrentProxy().then(current_proxy=> {
		if (!current_proxy.id) {
			return enableFirstProxy();
		} else {
			return getProxies().then(proxies=> {
				if (!proxies.length) {
					notifyError(__('message_proxylist_is_empty'));
					return Promise.reject()
				}
				const idx = proxies.findIndex(proxy=>proxy.id === current_proxy.id);
				switch (idx) {
					case -1:
					case proxies.length - 1:
						return proxies[0];
					default:
						return proxies[idx + 1];
				}
			}).then(proxy=>applyCurrentProxy(proxy))
		}
	});
}

/**
 * Switches to the previous proxy on proxylist
 * If no proxy was enabled since startup enableLastProxy() is called instead
 *
 * @returns {Promise}
 */
function enablePrevProxy() {
	return getCurrentProxy().then(current_proxy=> {
		if (!current_proxy.id) {
			return enableLastProxy();
		} else {
			return getProxies().then(proxies=> {
				if (!proxies.length) {
					notifyError(__('message_proxylist_is_empty'));
					return Promise.reject()
				}
				const idx = proxies.findIndex(proxy=>proxy.id === current_proxy.id);

				switch (idx) {
					case -1:
					case 0:
						return proxies[proxies.length - 1];
					default:
						return proxies[idx - 1];
				}
			}).then(proxy=>applyCurrentProxy(proxy))
		}
	});
}