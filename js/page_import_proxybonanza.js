'use strict';

$(function () {
	const $userpackagetablebox = $('#userpackagetablebox'), $tbody = $userpackagetablebox.find('tbody'),
		$userpackageerrorbox = $('#userpackageerrorbox'), $userpackage_missing_api_key = $('#userpackage_missing_api_key'),
		$userpackage_error = $('#userpackage_error'), $userpackage_row_template = $('#userpackage_row_template');


	ProxybonanzaApi.getUserpackages().then(
		userpackages=> {
			$userpackageerrorbox.hide();
			$tbody.find('tr').addClass('deleteflag');
			userpackages.forEach(userpackage=> {
				let $tr = $('#userpackage_' + userpackage.id);
				const newrow = !$tr.length;
				if (newrow) {
					$tr = $($userpackage_row_template.html().trim());
					$tr.attr('id', 'userpackage_' + userpackage.id).data(userpackage);
				} else {
					$tr.removeClass('deleteflag');
				}

				if (userpackage.package.name && userpackage.package.name !== '' && (newrow || userpackage.package.name !== $tr.data('package').name)) {
					$tr.find('.userpackage-name').text(userpackage.package.name);
				}

				if (userpackage.package.howmany_ips && userpackage.package.howmany_ips !== '' && (newrow || userpackage.package.howmany_ips !== $tr.data('package').howmany_ips)) {
					$tr.find('.userpackage-ip').text(userpackage.package.howmany_ips);
				}

				if (userpackage.bandwidth && userpackage.package.bandwidth && (newrow || userpackage.bandwidth !== $tr.data('bandwidth'))) {
					const $meter = $tr.find('.userpackage-transfer meter');
					$meter.attr('value', userpackage.bandwidth / userpackage.package.bandwidth);
					$meter.attr('title', Math.round(userpackage.bandwidth / 1073741824, 2) + ' GiB');
				}

				if (userpackage.expires && userpackage.expires !== '') {
					if (new Date(userpackage.expires) < new Date()) {
						return;
					}
					$tr.find('.userpackage-expiration').text(new Date(userpackage.expires).toLocaleDateString());
				}

				if (newrow) {
					$tr.find('a.import-button').click(e=> {
						e.preventDefault();
						const $tr = $(e.target).closest('tr');
						$('.import-button').attr('disabled', true);
						ProxybonanzaApi.getUserpackageProxylist(parseInt($tr.data('id'), 10))
							.then(saveProxies)
							.then(()=> {
								$('.import-button').attr('disabled', false);
								document.location = 'page_proxylist.html';
							});
					});
					$tbody.append($tr);
					$tr.trigger('create');
				}

			});
			$userpackagetablebox.show();
		},
		error=> {
			$userpackagetablebox.hide();
			getPreferences('apiKey').then(preferences=> {
				if (error == "401 - Unauthorized" && (!preferences.apiKey || preferences.apiKey === '')) {
					$userpackage_missing_api_key.show();
					$userpackage_error.empty();
				} else {
					$userpackage_missing_api_key.hide();
					$userpackage_error.text(error);
				}
				$userpackageerrorbox.show();
			});

		}
	);
});