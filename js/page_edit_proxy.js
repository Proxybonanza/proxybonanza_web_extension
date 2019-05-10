'use strict';

$(function () {

	/**
	 * Fill a form with provided proxy object data
	 * @param proxy
	 */
	function setEditFormValues(proxy) {
		if (proxy.countrycode) $('#form_country').val(proxy.countrycode || '').change();
		$('#form_label').val(proxy.label || '').change();
		$('#form_ip').val(proxy.ip || '').change();
		$('#form_http_port').val(proxy.httpport || '').change();
		$('#form_socks_port').val(proxy.socksport || '').change();
		$('#form_username').val(proxy.username || '').change();
		$('#form_password').val(proxy.password || '').change();
	}

	/**
	 * Get proxy object data from a provided form data
	 *
	 * @returns {{id: (*|string), countrycode: string, label: string, ip: string, httpport: Number, socksport: Number, username: string, password: string}}
	 */
	function getEditFormValues() {
		return {
			id: getQueryVariable('id') || 'custom_' + Date.now(),
			countrycode: String($('#form_country').val()),
			label: String($('#form_label').val()),
			ip: String($('#form_ip').val()),
			httpport: parseInt($('#form_http_port').val(), 10),
			socksport: parseInt($('#form_socks_port').val(), 10),
			username: String($('#form_username').val()),
			password: String($('#form_password').val())
		};
	}

	/**
	 * id of the proxy object we are about to edit
	 * empty id means creation of new proxy object
	 */
	let proxy_id = getQueryVariable('id');

	if (proxy_id) {
		getProxy(proxy_id).then(
			setEditFormValues,
			()=>notifyError('Invalid proxy id')
		);
	} else {
		setEditFormValues({
			label: 'Local',
			ip: '127.0.0.1',
			httpport: 8080
		});
	}

	/**
	 * Save proxy and return to the proxylist on form submit
	 */
	$('#edit_proxy').submit(e=> {
		e.preventDefault();
		saveProxy(getEditFormValues()).then(
			()=>window.location = 'page_proxylist.html',
		);

	});

	/**
	 * Pretty format countries
	 */
	function country_select_format(item) {
		let value = item.element[0].value.toLowerCase();
		value = value === '' ? value = 'unknown' : value.toLowerCase();
		return '<img  src="img/flags/' + value + '.png"/> ' + $(item.element[0]).text();
	}

	$('#form_country').select2({
		formatResult: country_select_format,
		formatSelection: country_select_format,
		escapeMarkup: m=>m
	});
});