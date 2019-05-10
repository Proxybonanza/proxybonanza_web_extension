'use strict';

$(function () {
	const $copybox = $('#copybox');

	/**
	 * Generates CSV content from proxylist
	 * @returns {Promise}
	 */
	function getCSV() {
		return getProxies().then(proxies=> {
			if (!proxies.length) {
				notifyError('Cannot export. Your proxy list is empty.');
				return Promise.reject();
			}
			const csv = [];
			let glue = $('#import_export_glue').val();
			if (glue === 'tab') {
				glue = '\t';
			}
			proxies.forEach(proxy=> {
				const csvrow = [];
				if ($('#import_export_countrycode').prop('checked')) {
					csvrow.push(proxy.countrycode);
				}
				if ($('#import_export_label').prop('checked')) {
					csvrow.push(proxy.label);
				}
				csvrow.push(proxy.ip);

				if ($('#import_export_http_port').prop('checked')) {
					csvrow.push(proxy.httpport);
				}
				if ($('#import_export_socks_port').prop('checked')) {
					csvrow.push(proxy.socksport);
				}
				if ($('#import_export_username').prop('checked')) {
					csvrow.push(proxy.username);
				}
				if ($('#import_export_password').prop('checked')) {
					csvrow.push(proxy.password);
				}
				csv.push(csvrow.join(glue));
			});
			return csv.join('\n');
		});
	}

	$('#import_export_proxy').change(e=> {
		getCSV().then(csvdata=> {
			$copybox.text(csvdata);
			$('.export_link').attr('href', 'data:text/csv;base64,' + utf8_to_base64(csvdata));
			$('.preview_link').attr('href', 'data:text/plain;base64,' + utf8_to_base64(csvdata));

		});
	}).change()
});