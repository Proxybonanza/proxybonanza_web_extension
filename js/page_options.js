'use strict';

$(()=> {
	const $inputs = $('.form-control');

	//Populate fields with current values on startup
	getPreferences().then(preferences=> {
		$inputs.each((idx, input)=> {
			const key = input.name;
			if (preferences.hasOwnProperty(key)) {
				const $input = $('#' + key);
				if ($input.length) {
					$input.val(preferences[key] + '');
				}
			}
		});
	});

	//Update preferences on input change
	$inputs.on('input change', e=> {
		if (e.target.checkValidity()) {
			const preferences = {};
			const $input = $(e.target);
			const key = e.target.name;

			let value = $input.val();
			if ($input.prop('type') != 'text') {
				value = parseInt(value, 10) || value;
				if (value === '0') value = 0;
			}
			preferences[key] = value;
			setPreferences(preferences);
		}
	});

	//Update inputs on external preference change
	$inputs.each((idx, input)=> {
		const key = input.name;
		const $input = $(input);
		$(document).on(key + '_changed', (e, change)=> {
			//console.log(key+'_changed',change);
			$input.val(change.newValue + '');
		});
	});
});