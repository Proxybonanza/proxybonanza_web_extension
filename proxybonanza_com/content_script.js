'use strict';

/**
 * Receive messages from proxybonanza.com website
 * Calls fromProxybonanzaCom() when message adressed to_browser_addon is received
 */
window.addEventListener('message', e=> {
	if (e.origin == window.location.origin && e.data.direction && e.data.direction == 'to_browser_addon') {
		const data = e.data.message;
		fromProxybonanzaCom.apply(null, data);
	}
});

/**
 * Send message to proxybonanza.com website
 */
function toProxybonanzaCom() {
	const args = Array.prototype.slice.call(arguments);
	//console.log('addon toProxybonanzaCom',args);
	window.postMessage(
		{
			direction: 'from_browser_addon',
			message: args
		},
		window.location.origin
	);
}

/**
 * Notify proxybonanza.com that addon is ready to lissen
 */
toProxybonanzaCom('ready', 'webext');

/**
 * Handles messages received from proxybonanza.com website
 * @param event
 * @param data
 */
function fromProxybonanzaCom(event, data) {
	switch (event) {
		case 'proxybonanza_com_logged_in':
			//User has logged in on proxybonanza.com
			//If no apiKey is provided in preferences
			//we can ask user to import it automatically for him
			getPreferences('apiKey').then(preferences=> {
				if (!preferences.apiKey || preferences.apiKey === '') {
					toast(__('message_import_proxybonanza_com_api_key'));
					toProxybonanzaCom('get_api_key_from_proxybonanza_com');
				}
			}, ()=>console.error('error'));
			break;
		case 'proxybonanza_com_current_api_key':
			//proxybonanza.com has sent apiKey in response to apiKey request
			//let's store it in preferences
			if (data && data !== '') {
				getPreferences().then(preferences=> {
					if (preferences.apiKey != data) {
						setPreferences({'apiKey': data});
						toast(__('message_import_proxybonanza_com_api_key_done'));
					}
				});
			} else {
				notifyError(__('message_import_proxybonanza_com_api_key_fail'));
			}
			break;
		case 'importUserpackage':
			//user has clicked "import userpackage to addon" button on proxybonanza.com website
			//lets import it then
			ProxybonanzaApi.getUserpackageProxylist(data).then(saveProxies);
			break;
		default:
			//proxybonanza.com has send unknown unsupported message type
			//propably this addon version is outdated and user needs to update this addon
			//lets report back this fact to proxybonanza.com
			//website script should display appropriate error message
			toProxybonanzaCom('unsupported', event);
	}
}
