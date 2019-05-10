'use strict';

/**
 * Translates and replaces tokens with sprintf function
 * @param id
 * @param extra_args
 * @returns {*}
 * @private
 */
function __(id, extra_args) {
	if (!id || id == '') {
		return false;
	}
	const translated = browser.i18n.getMessage(id);
	if (!translated) {
		return false;
	}
	if (translated === '') {
		return false;
	}
	if (!extra_args) {
		return translated;
	}
	const args = Array.prototype.slice.call(arguments);
	args[0] = translated;
	return sprintf.apply(null, args);
}

/**
 * Automatically translate all html tags with data-l10n-id attribute
 * Leaves tag content intact if no translation is available
 * Also translates content of placeholder attributes if present
 */
$(()=> {
	$('[data-l10n-id]').each(function (idx, el) {
		const $el = $(el);
		const id = $el.attr('data-l10n-id');
		if (id) {
			let translated = __(id);
			if (translated) {
				$el.text(translated);
			}
			if ($el.attr('placeholder')) {
				translated = __(id + '__placeholder');
				if (translated) {
					$el.attr('placeholder', translated);
				}
			}
		}
	});
});
