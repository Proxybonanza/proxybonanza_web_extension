'use strict';
/**
 * Generate proxybonanza manage context menu
 *
 * @param proxies
 * @param current_proxy
 * @returns {Promise}
 */
function updateMenu(proxies, current_proxy) {
	return browser.contextMenus.removeAll().then(()=> {
		browser.contextMenus.create({
			title: __('openButton_label'),
			contexts: ['all'],
			onclick: menuItem=> {
				openProxyManager()
			}
		});
		if (proxies.length) {
			browser.contextMenus.create({
				type: 'separator',
				contexts: ['all']
			});
			browser.contextMenus.create({
				id: 'proxy_list_menu',
				title: __('change_proxy_to'),
				contexts: ['all'],
			});

			proxies.forEach(proxy=> {
				let flag = 'unknown';
				if (proxy.countrycode) {
					flag = proxy.countrycode.toLowerCase();
				}
				const ucase_label = proxy.label.charAt(0).toUpperCase() + proxy.label.substr(1).toLowerCase();
				const proxy_id = proxy.id;
				const menuitem_id = browser.contextMenus.create({
					id: 'proxy_' + proxy.id,
					parentId: 'proxy_list_menu',
					type: 'radio',
					title: proxy.countrycode + ', ' + ucase_label + ' [' + proxy.ip + ']',
					checked: current_proxy.id === proxy.id,
					contexts: ['all'],
					onclick: menuItem=> {
						setCurrentProxy(proxy_id);
					}
				});
				browser.contextMenus.update(menuitem_id, {
					icons: {
						'16': '/img/flags/' + flag + '.png'
					},
				}).catch(e=>console.error);

			});
			browser.contextMenus.create({
				type: 'separator',
				contexts: ['all']
			});
			browser.contextMenus.create({
				title: __('next'),
				contexts: ['all'],
				onclick: enableNextProxy
			});
			browser.contextMenus.create({
				title: __('previous'),
				contexts: ['all'],
				onclick: enablePrevProxy
			});
			if (current_proxy.ip) {
				browser.contextMenus.create({
					title: __('disable'),
					contexts: ['all'],
					onclick: disableCurrentProxy
				});
			}
		}
	});
}

/**
 * Updates context menu when current proxy has been changed
 */
$(document).on('current_proxy_changed', (e, current_proxy, sender)=> {
	getProxies().then(proxies=> {
		updateMenu(proxies, current_proxy);
	});
});

/**
 * Updates context menu when proxylist has been modified
 */
$(document).on('proxies_changed', (e, change)=> {
	const proxies = change.newValue;
	getCurrentProxy().then(current_proxy=> {
		updateMenu(proxies, current_proxy);
	});
});

/**
 * Generate context menu on startup
 */
Promise.all([getProxies(), getCurrentProxy()]).then(result=> {
	const [proxies,current_proxy]=result;
	updateMenu(proxies, current_proxy);
});
