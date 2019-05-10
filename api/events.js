'use strict';

/**
 * Maps pac script messages to jQuery events
 */
browser.runtime.onMessage.addListener((msg, sender)=> {
	if (msg.event) {
		$(document).trigger(msg.event, msg.data, sender);
	}
});

/**
 * Maps generic storage.onChanged events into invidual jQuery [fieldname]_changed events for each field
 */
browser.storage.onChanged.addListener((changes, area)=> {
	Object.keys(changes).forEach(item=> {
		if (changes[item].newValue !== changes[item].oldValue) {
			$(document).trigger(item + '_changed', changes[item]);
		}
	});
});