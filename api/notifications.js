'use strict';

/**
 * Close notification after timeout time
 *
 * @param notification_id
 * @param timeout
 * @returns {Promise}
 */
function autoCloseNotification(notification_id, timeout) {
	return new Promise(resolve=> {
		setTimeout(()=> {
			resolve(browser.notifications.clear(notification_id));
		}, timeout);
	});
}

/**
 * Displays notification text for 3 seconds
 *
 * @param text
 * @returns {Promise}
 */
function notify(text) {
	return getPreferences('notifications').then(preferences=> {
		if (!preferences.notifications) {
			return false;
		}

		const addon_name = __('addon_name');

		return browser.notifications.create({
			'type': 'basic',
			'iconUrl': 'img/proxybonanza_logo128.png',
			'title': addon_name,
			'message': text
		}).then(notification_id=> {
			autoCloseNotification(notification_id, 3000);
			return notification_id;
		});
	});
}

/**
 * Displays notification text for 1.5 seconds
 *
 * @param text
 * @returns {Promise}
 */
function toast(text) {
	return getPreferences('notifications').then(preferences=> {
		if (!preferences.notifications) {
			return false;
		}

		const addon_name = __('addon_name');

		return browser.notifications.create({
			'type': 'basic',
			'iconUrl': 'img/proxybonanza_logo128.png',
			'title': addon_name,
			'message': text
		}).then(notification_id=> {
			autoCloseNotification(notification_id, 1500);
			return notification_id;
		});
	});
}

/**
 * Displays error notification
 * Error notification can be only closed manually by users
 * Error notification ignore addon's notifications preferences
 *
 * @param text
 * @returns {Promise}
 */
function notifyError(text) {
	const addon_name = __('addon_name');

	return browser.notifications.create({
		'type': 'basic',
		'iconUrl': 'img/proxybonanza_logo128.png',
		'title': addon_name,
		'message': text
	});
}