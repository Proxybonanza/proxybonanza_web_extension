'use strict';
if (Notification.permission !== "granted") {
	Notification.requestPermission();
}

/**
 * Displays notification text for 3 seconds via HTML5 Notification API
 *
 * @param text
 * @returns {Promise}
 */
async function notify(text) {
	const notifications = await getPreference('notifications');
	if (!notifications) {
		return false;
	}

	var addon_name = __('addon_name', 'Proxybonanza Manager');

	if (Notification.permission !== "granted") {
		Notification.requestPermission();
	}

	var notification = new Notification(addon_name, {
		icon: '/img/proxybonanza_logo128.png',
		body: text
	});

	setTimeout(()=>notification.close(), 3000);
}

/**
 * Displays notification text for 1.5 seconds via HTML5 Notification API
 *
 * @param text
 * @returns {Promise}
 */
async function toast(text) {
	const notifications = await getPreference('notifications');
	if (!notifications) {
		return false;
	}

	var addon_name = __('addon_name', 'Proxybonanza Manager');

	if (Notification.permission !== "granted") {
		Notification.requestPermission();
	}

	var notification = new Notification(addon_name, {
		icon: '/img/proxybonanza_logo128.png',
		body: text
	});

	setTimeout(()=>notification.close(), 1500);
}

/**
 * Displays error notification via HTML5 Notification API
 * Error notification can be only closed manually by users
 * Error notification ignore addon's notifications preferences
 *
 * @param text
 * @returns {Promise}
 */
async function notifyError(text) {
	var addon_name = __('addon_name', 'Proxybonanza Manager');

	if (Notification.permission !== "granted") {
		Notification.requestPermission();
	}

	var notification = new Notification(addon_name, {
		icon: '/img/proxybonanza_logo128.png',
		body: text
	});

	setTimeout(()=>notification.close(), 3000);
}