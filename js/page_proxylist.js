/*global $,strpos,stripos,countryList,getQueryVariable,disableCurrentProxy,setCurrentProxy,getProxylist,getCurrentProxy,deleteProxy,nextProxy,prevProxy*/
'use strict';
$(()=> {

	const $emptylistbox = $('#emptylistbox'), $tablebox = $('#tablebox'), $proxy_nav = $('#proxy_nav'),
		$tbody = $tablebox.find('tbody'), $proxy_row_template = $($('#proxy_row_template').html().trim()), $emptysearchbox = $('#emptysearchbox'),
		$searchform = $('#searchform'), $searchform_input = $searchform.find('input[type=search]'),
		$proxyToogle = $('.toogle-proxy');


	/**
	 * Replace row with the one with new updated data
	 *
	 * @param proxy
	 * @param current_proxy
	 *
	 * @returns {jQuery} new updated row
	 */
	function updateRow(proxy, current_proxy) {
		const $tr = $proxy_row_template.clone();
		$tr.attr('id', 'proxy_' + proxy.id);

		if (proxy.proxybonanza) {
			$tr
				.addClass('proxybonanza')
				.find('.pb_userpackage')
				.empty()
				.append(
					$('<img>', {
						'class': 'pb_logo',
						'src': 'img/ico_logo.png',
						'title': proxy.userpackage_name,
					})
				)
				.append(
					$('<span>', {
						'class': 'userpackage_name'
					}).text(proxy.userpackage_name)
				);
		}

		if (proxy.countrycode) {
			let flag = proxy.countrycode.toLowerCase();
			const countryname = countryList[proxy.countrycode] || __('unknown');

			$tr.find('.countrycode')
				.empty()
				.append(
					$('<img>', {
						'class': 'flag',
						'src': 'img/flags/' + flag + '.png',
						'title': countryname,
					})
				)
				.append(
					$('<span>', {
						'class': 'countryname'
					}).text(countryname)
				);
		}

		if (proxy.label && proxy.label !== '') {
			$tr.find('.proxylabel').removeAttr('data-l10n-id').text(proxy.label);
		}

		if (proxy.ip && proxy.ip !== '') {
			$tr.find('.ip').text(proxy.ip);
		}

		$tr.data(proxy);

		if (current_proxy.id && current_proxy.id === proxy.id) {
			$tr.addClass('selected').removeClass('not_selected');
		} else {
			$tr.addClass('not_selected').removeClass('selected');
		}
		return $tr;
	}

	/**
	 * Higlights currently actived proxy
	 *
	 * @param current_proxy
	 */
	function updateCurrentProxy(current_proxy) {
		$('.selected').removeClass('selected').addClass('not_selected');
		if (current_proxy.ip) {
			$proxy_nav.addClass('proxyEnabled').removeClass('proxyDisabled');
			$proxyToogle.addClass('btn-danger').removeClass('btn-success');
			$('#proxy_' + current_proxy.id).addClass('selected').removeClass('not_selected');
		} else {
			$proxy_nav.addClass('proxyDisabled').removeClass('proxyEnabled');
			$proxyToogle.addClass('btn-success').removeClass('btn-danger');
		}
	}

	/**
	 * Renders proxy rows
	 *
	 * @param filteredProxies array
	 * @param current_proxy
	 * @returns {Promise}
	 */
	function buildProxytable(filteredProxies, current_proxy) {
		$tbody.empty();

		if (filteredProxies.length) {
			$tablebox.removeClass('perm_hide_edit_action');
			$tablebox.removeClass('perm_hide_pb_userpackage');

			const edit_column = filteredProxies.some(proxy=>!proxy.proxybonanza);
			if (!edit_column) {
				$tablebox.addClass('perm_hide_edit_action');
			}

			const pb_column = filteredProxies.some(proxy=>proxy.proxybonanza);
			if (!pb_column) {
				$tablebox.addClass('perm_hide_pb_userpackage');
			}

			const $trs = filteredProxies.map(proxy=>updateRow(proxy, current_proxy));
			$tbody.hide();
			$trs.forEach($tr=>$tr.appendTo($tbody));
			$trs.forEach($tr=>$tr.trigger('create'));
			$tbody.show();

			return fixHorizontalScrollbar();
		} else {
			return Promise.resolve();
		}
	}

	/**
	 * Check if horisontal scrollbal is visible
	 *
	 * @returns {Promise}
	 */
	function checkHorizontalScrollbar() {
		return new Promise(resolve=> {
			_.defer(()=> {
				resolve($tablebox.width() < $tablebox.get(0).scrollWidth);
			});
		});
	}

	/**
	 * Reveals all hidden gui elements
	 */
	function resetHorizontalScrollbar() {
		$tablebox.removeClass('hide_thead');
		$tablebox.removeClass('hide_edit_action');
		$tablebox.removeClass('hide_delete_action');
		$tablebox.removeClass('hide_pb_userpackage');
		$tablebox.removeClass('hide_countryname');
		$tablebox.removeClass('hide_countrycode');
		$tablebox.removeClass('hide_proxylabel');
		$tablebox.removeClass('hide_userpackage_name');
		$tablebox.removeClass('small_buttons');
		$tablebox.removeClass('allow_wrap');
	}

	/**
	 * Gradually hides optional gui elements until horizontal scrollbar is gone
	 *
	 * @returns {Promise}
	 */
	function fixHorizontalScrollbar() {
		return checkHorizontalScrollbar().then(scrollbar_exists=> {
			if (!scrollbar_exists) {
				return Promise.resolve();
			}

			if (!$tablebox.hasClass('small_buttons')) {
				$tablebox.addClass('small_buttons');
				return fixHorizontalScrollbar();
			}
			if (!$tablebox.hasClass('hide_userpackage_name')) {
				$tablebox.addClass('hide_userpackage_name');
				return fixHorizontalScrollbar();
			}
			if (!$tablebox.hasClass('hide_countryname')) {
				$tablebox.addClass('hide_countryname');
				return fixHorizontalScrollbar();
			}

			if (!$tablebox.hasClass('hide_pb_userpackage')) {
				$tablebox.addClass('hide_pb_userpackage');
				return fixHorizontalScrollbar();
			}

			if (!$tablebox.hasClass('hide_thead')) {
				$tablebox.addClass('hide_thead');
				return fixHorizontalScrollbar();
			}

			if (!$tablebox.hasClass('hide_proxylabel')) {
				$tablebox.addClass('hide_proxylabel');
				return fixHorizontalScrollbar();
			}

			if (!$tablebox.hasClass('hide_countrycode')) {
				$tablebox.addClass('hide_countrycode');
				return fixHorizontalScrollbar();
			}

			if (!$tablebox.hasClass('hide_edit_action')) {
				$tablebox.addClass('hide_edit_action');
				return fixHorizontalScrollbar();
			}

			if (!$tablebox.hasClass('hide_delete_action')) {
				$tablebox.addClass('hide_delete_action');
				return fixHorizontalScrollbar();
			}

			if (!$tablebox.hasClass('allow_wrap')) {
				$tablebox.addClass('allow_wrap');
				return fixHorizontalScrollbar();
			}

			return Promise.reject();
		});
	}

	/**
	 * Should be called on window resize and on orientation change
	 * Shows/hides optional gui elements in order to get optimal fit of gui elements into current pixel width
	 */
	function recalculateHorizontalScrollbar() {
		resetHorizontalScrollbar();
		fixHorizontalScrollbar();
	}

	$tablebox.on('click', 'td:not(.actions)', e=> {
		const $this = $(e.target);
		const $tr = $this.closest('tr');
		const id = $tr.data('id');
		if ($tr.hasClass('selected')) {
			disableCurrentProxy();
		} else {
			setCurrentProxy(id);
		}
	});

	$tablebox.on('click', 'a.edit_proxy', e=> {
		const $this = $(e.target);
		const $tr = $this.closest('tr');
		const id = $tr.data('id');
		$this.attr('href', 'page_edit_proxy.html?id=' + id);
	});

	$tablebox.on('click', 'a.delete', e=> {
		const $this = $(e.target);
		const $tr = $this.closest('tr');
		const id = $tr.data('id');
		deleteProxy(id);
		e.preventDefault();
	});

	/**
	 * Filters proxylist by current searchbox value
	 *
	 * @param proxies array
	 * @returns array
	 */
	function getFilteredProxies(proxies) {
		const q = $searchform_input.val();
		if (q === '' || !q) return proxies;
		return proxies.filter(proxy=> {
			const s_countryList = proxy.countrycode && stripos(countryList[proxy.countrycode], q) !== false;
			const s_countrycode = proxy.countrycode && stripos(proxy.countrycode, q) !== false;
			const s_ip = proxy.ip && strpos(proxy.ip, q) !== false;
			const s_label = proxy.label && stripos(proxy.label, q) !== false;
			const s_userpackage_name = proxy.userpackage_name && stripos(proxy.userpackage_name, q) !== false;
			return s_countryList || s_countrycode || s_ip || s_label || s_userpackage_name;
		});
	}

	/**
	 * Renders all proxylist gui content
	 *
	 * @param proxies
	 * @param current_proxy
	 * @returns {*}
	 */
	function reloadProxylist(proxies, current_proxy) {
		const filteredProxies = getFilteredProxies(proxies);
		if (proxies.length) {
			$tablebox.show();
			$emptylistbox.hide();
			$proxy_nav.show();
			if (filteredProxies.length) {
				$emptysearchbox.hide();
			} else {
				$emptysearchbox.show();
			}
		} else {
			$tablebox.hide();
			$emptylistbox.show();
			$proxy_nav.hide();
		}

		if (current_proxy.ip) {
			$proxy_nav.addClass('proxyEnabled').removeClass('proxyDisabled');
			$proxyToogle.addClass('btn-danger').removeClass('btn-success');
		} else {
			$proxy_nav.addClass('proxyDisabled').removeClass('proxyEnabled');
			$proxyToogle.addClass('btn-success').removeClass('btn-danger');
		}

		return buildProxytable(filteredProxies, current_proxy);
	}

	const reloadProxylistDebounced = _.debounce(()=> {
		Promise.all([getProxies(), getCurrentProxy()]).then(results=>reloadProxylist(...results))
	}, 1000);

	$searchform_input.on('input change', reloadProxylistDebounced);

	$searchform.submit(e=>false);

	$('.prev-proxy').click(e=> {
		enablePrevProxy();
		e.preventDefault();
	});

	$('.next-proxy').click(e=> {
		enableNextProxy();
		e.preventDefault();
	});

	$proxyToogle.click(e=> {
		toogleLastProxy();
		e.preventDefault();
	});

	$(document).on('current_proxy_changed', (e, current_proxy, sender)=> {
		updateCurrentProxy(current_proxy);
	});

	$(document).on('proxies_changed', (e, change)=> {
		getCurrentProxy().then(current_proxy=>reloadProxylist(change.newValue, current_proxy))
	});

	$(window).resize(e=>recalculateHorizontalScrollbar());


	Promise.all([getProxies(), getCurrentProxy()]).then(results=>reloadProxylist(...results));

	if (hasBrowserObject && window != window.top) {
		document.querySelectorAll('a.firefox-popup-fix').forEach(a=> {
			$(a).click(e=> {
				openInNewTab(a.href);
				e.preventDefault();
			})
		});
	}
});

