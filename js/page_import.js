'use strict';

$(()=> {
	const $pastebox = $('#pastebox'), $import_file = $('#import_file');

	$pastebox.click(e=> {
		$(e.target).select();
	});

	/**
	 * List of user selected fields
	 *
	 * @returns {Array}
	 */
	function getCsvFields() {
		const fields = [];
		if ($('#import_export_countrycode').prop('checked')) {
			fields.push('countrycode');
		}
		if ($('#import_export_label').prop('checked')) {
			fields.push('label');
		}
		fields.push('ip');
		if ($('#import_export_http_port').prop('checked')) {
			fields.push('httpport');
		}
		if ($('#import_export_socks_port').prop('checked')) {
			fields.push('socksport');
		}
		if ($('#import_export_username').prop('checked')) {
			fields.push('username');
		}
		if ($('#import_export_password').prop('checked')) {
			fields.push('password');
		}
		return fields;
	}

	/**
	 * Returns glue
	 *
	 * @returns {String}
	 */
	function getGlue() {
		let glue = $('#import_export_glue').val();
		if (glue === 'tab') {
			glue = '\t';
		}
		return glue;
	}


	/**
	 * Simple CSV parse function
	 *
	 * @param csv text content to parse
	 * @param fields list of user selected fields
	 * @param glue
	 * @returns {Array}
	 */
	function csvToArray(csv, fields, glue) {
		const fieldnum = fields.length, proxies = [];
		csv.split('\n').forEach(csvline=> {
			const values = csvline.split(glue);
			if (values.length === fieldnum) {
				const proxy_obj = {};
				for (let j = 0; j < fieldnum; j += 1) {
					proxy_obj[fields[j]] = values[j];
				}
				proxies.push(proxy_obj);
			}
		});
		return proxies;
	}

	/**
	 * Filter out empty or invalid rows
	 *
	 * @param proxies
	 * @returns {Array}
	 */
	function validateProxies(proxies) {
		const validProxies = [];
		const id_prefix = 'csv_' + Date.now();
		proxies.forEach((proxy, idx)=> {
			if (proxy.countrycode && proxy.countrycode !== '' && !countryList[proxy.countrycode]) {
				return false;
			}
			if (!(proxy.ip + '').match(/((^|\.)((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]?\d))){4}$/)) {
				return false;
			}
			if (proxy.httpport && proxy.httpport !== '' && !(proxy.httpport + '').match(/[1-9][0-9]*/)) {
				return false;
			}
			proxy.httpport = parseInt(proxy.httpport, 10) || undefined;
			if (proxy.socksport && proxy.socksport !== '' && !(proxy.socksport + '').match(/[1-9][0-9]*/)) {
				return false;
			}
			proxy.socksport = parseInt(proxy.socksport, 10) || undefined;
			if (!proxy.httpport && !proxy.socksport) {
				return false;
			}

			proxy.id = id_prefix + '_' + idx;
			validProxies.push(proxy);
		});
		return validProxies;
	}

	/**
	 * Parses and imports CSV content
	 *
	 * @param csv
	 * @param fields
	 * @param glue
	 * @returns {Promise}
	 */
	function importCSV(csv, fields, glue) {
		const proxies = csvToArray(csv, fields, glue);
		const validProxies = validateProxies(proxies);
		if (!validProxies.length) {
			notifyError('Invalid columns');
			return Promise.reject();
		}
		return saveProxies(validProxies);
	}

	$('#import_link').click(e=> {
		e.preventDefault();
		importCSV($pastebox.val(), getCsvFields(), getGlue()).then(()=> window.location = e.target.href);
	});

	$import_file.change(e=> {
		const file = $import_file[0].files[0];
		readFile(file).then(content=> {
			$pastebox.val(content)
		})
	});

	/**
	 * Returns text content of provided file
	 *
	 * @param file
	 * @returns {Promise}
	 */
	function readFile(file) {
		return new Promise(resolve=> {
			const fReader = new FileReader();
			fReader.onload = function (e) {
				resolve(e.target.result);
			};
			fReader.readAsText(file);
		});
	}
});