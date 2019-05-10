'use strict';
/**
 * This class handles connections to proxybonanza public api
 * @url http://blog.proxybonanza.com/v1-api-reference/
 */
class ProxybonanzaApi {
	/**
	 * Performs GET connection for a given resource
	 * Performs authorisation via apikey automatically
	 * Api errors are translated as rejected promise
	 *
	 * @param controller
	 * @param id
	 * @returns {Promise}
	 */
	static get(controller, id) {
		let invalid_apikey = false;
		return browser.storage.local.get('apiKey').then(data=> {
			if (!data.apiKey || data.apiKey === '') {
				invalid_apikey = true;
			}
			return data.apiKey;
		}).then(apiKey=> {
			const api_url = 'https://proxybonanza.com/api/v1/';
			const extra_headers = {
				'X-Proxybonanza-ApiKey': apiKey
			};
			if (id) {
				id = '/' + id;
			} else {
				id = '';
			}
			const url = api_url + controller + id + '.json';
			return $.ajax({
				url: url,
				dataType: 'json',
				headers: extra_headers || {},
			}).then(
				response=> {
					if (response.success || controller == 'unauthenticate') {
						return response.data;
					} else {
						console.error({
							url: url,
							extra_headers: extra_headers,
							response: response
						});
						return Promise.reject(response.code + ' - ' + response.message);
					}
				},
				(xhr, status, error)=> {
					if (xhr.responseJSON) {
						if (controller == 'unauthenticate') {
							return Promise.resolve();
						}
						console.error({
							url: url,
							response: xhr.responseJSON
						});
						if (invalid_apikey) {
							notifyError(__('message_invalid_api_key'));
						}
						return Promise.reject(xhr.responseJSON.code + ' - ' + xhr.responseJSON.message);
					}
					console.error({
						url: url,
						extra_headers: extra_headers,
						status: status,
						error: error,
						xhr: xhr,
					});
					notifyError("An AJAX error occured: " + status + "\nError: " + error + "\nError detail: " + xhr.responseText);
					return Promise.reject(error);
				}
			);
		});
	}

	/**
	 * Returns list of userpackages owned by user
	 *
	 * @returns {Promise}
	 */
	static getUserpackages() {
		return this.unauthenticate().then(()=> {
			return this.get('userpackages');
		});
	}

	/**
	 * Return list of proxies attached to a given userpackage
	 *
	 * @param userpackage_id
	 * @returns {Promise}
	 */
	static getUserpackageProxylist(userpackage_id) {
		if (userpackage_id > 0) {
			return this.unauthenticate().then(()=> {
				return this.get('userpackages', parseInt(userpackage_id, 10)).then(
					userpackage=> {
						if (new Date(userpackage.expires) < new Date()) {
							return Promise.reject('Userpackage ' + userpackage.package.name + ' has expired');
						}
						return userpackage.ippacks.map(ippack=> {
							return {
								id: 'ippack_' + ippack.id,
								countrycode: ippack.proxyserver.georegion.country.isocode,
								label: ippack.proxyserver.georegion.name,
								ip: ippack.ip,
								httpport: ippack.port_http,
								socksport: ippack.port_socks,
								username: userpackage.login,
								password: userpackage.password,
								proxybonanza: true,
								userpackage_id: userpackage_id,
								userpackage_name: userpackage.package.name
							};
						});
					});
			});
		} else {
			console.error('invalid userpackage_id: ', userpackage_id);
			return Promise.reject();
		}
	}

	/**
	 * Return list of all proxies attached to any user owned userpackage
	 *
	 * @returns {Promise}
	 */
	static getUserpackagesProxylist() {
		return this.unauthenticate().then(()=> {
			return this.getUserpackages().then(userpackages=> {
				const proxylists_promises = userpackages.map(userpackage=>this.getUserpackageProxylist(userpackage.id));
				return Promise.all(proxylists_promises).then(proxylists=> {
					return proxylists.flat();
				});
			});
		});
	}

	/**
	 * Clears http authentication
	 * Should be called after every apiKey change
	 *
	 * @returns {Promise}
	 */
	static unauthenticate() {
		return this.get('unauthenticate');
	}
}