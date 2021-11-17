import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/js/std-js/theme-cookie.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/leaflet/map.js';
import 'https://cdn.kernvalley.us/components/leaflet/marker.js';
import 'https://cdn.kernvalley.us/components/leaflet/geojson.js';
import 'https://cdn.kernvalley.us/components/not-supported.js';
import 'https://cdn.kernvalley.us/components/ad/block.js';
import 'https://cdn.kernvalley.us/components/weather/current.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/install/prompt.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
import 'https://cdn.kernvalley.us/components/app/stores.js';
import 'https://cdn.kernvalley.us/components/share-to-button/share-to-button.js';
import 'https://cdn.kernvalley.us/components/disqus/comments.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import * as handlers from './handlers.js';
import { shareInit } from 'https://cdn.kernvalley.us/js/std-js/data-share.js';
import { $ } from 'https://cdn.kernvalley.us/js/std-js/esQuery.js';
import { ready, loaded } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { getCustomElement } from 'https://cdn.kernvalley.us/js/std-js/custom-elements.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { searchLocationMarker, createMarker, isOnGoing, filterEventNamesDatalist } from './functions.js';
import { GA } from './consts.js';

const nullSubmit = event => {
	event.preventDefault();
	const dialog = event.target.closest('dialog, toast-message');
	if (dialog instanceof HTMLElement) {
		if (dialog.close instanceof Function) {
			dialog.close;
		} else if (dialog.open === true) {
			dialog.open = false;
		}
	}
};

$(document.documentElement).toggleClass({
	'no-dialog': document.createElement('dialog') instanceof HTMLUnknownElement,
	'no-details': document.createElement('details') instanceof HTMLUnknownElement,
	'js': true,
	'no-js': false,
});

if (navigator.canShare() && typeof customElements.get('share-button') === 'undefined') {
	[...document.querySelectorAll('[is="share-button"]')].forEach(btn => {
		btn.dataset.shareTitle = btn.getAttribute('sharetitle') || document.title;
		btn.dataset.shareText = btn.getAttribute('text');
		btn.dataset.shareUrl = btn.hasAttribute('url') ? new URL(btn.getAttribute('url') || '.', location.origin).href : location.href;
		['sharetitle', 'text', 'url'].forEach(attr => btn.removeAttribute(attr));
		shareInit(btn);
	});
}

if (typeof GA === 'string' && GA !== '') {
	loaded().then(() => {
		requestIdleCallback(async () => {
			importGa(GA).then(async ({ ga }) => {
				ga('create', GA, 'auto');
				ga('set', 'transport', 'beacon');
				ga('send', 'pageview');

				$('a[rel~="external"]').click(externalHandler, { passive: true, capture: true });
				$('a[href^="tel:"]').click(telHandler, { passive: true, capture: true });
				$('a[href^="mailto:"]').click(mailtoHandler, { passive: true, capture: true });
			}).catch(console.error).finally(() => {
				const url = new URL(location.href);

				if (url.searchParams.has('utm_source')) {
					url.searchParams.delete('utm_source');
					url.searchParams.delete('utm_medium');
					url.searchParams.delete('utm_campaign');
					url.searchParams.delete('utm_term');
					url.searchParams.delete('utm_content');
					history.replaceState(history.state, document.title, url.href);
				}
			});
		});
	});
}

if (location.pathname.startsWith('/events') && ('IntersectionObserver' in window)) {
	ready().then(() => {
		$('.event-item').intersect(({ target, isIntersecting }) => {
			if (isIntersecting) {
				target.animate([{
					transform: 'rotateX(-30deg) scale(0.85) translateY(3em)',
					opacity: 0.3,
				}, {
					transform: 'none',
					opacity: 1,
				}], {
					duration: 300,
					easing: 'ease-in-out',
				});

				target.classList.remove('hidden');
			} else {
				target.classList.add('hidden');
			}
		});
	});
}

Promise.all([
	getCustomElement('install-prompt'),
	new URL(location.href),
	('URLPattern' in globalThis) ? { URLPattern } : import('https://unpkg.com/urlpattern-polyfill@1.0.0-rc1/dist/index.modern.js'),
	ready(),
]).then(async ([HTMLInstallPromptElement, url, { URLPattern }]) => {
	init();
	if (! ('URLPattern' in globalThis)) {
		globalThis.URLPattern = URLPattern;
	}

	$('#install-btn').click(() => new HTMLInstallPromptElement().show()).then($btns => $btns.unhide());

	if (url.pathname.startsWith('/map')) {
		if (url.searchParams.has('geo')) {
			const geo = new URL(url.searchParams.get('geo'));
			switch(geo.protocol) {
				case 'geo:':
				case 'web+geo:': {
					try {
						const { pathname: { groups: { latitude: lat = null, longitude: lng = null }}} = new URLPattern({
							protocol: '{web\\+}?geo:',
							pathname: ':latitude,:longitude',
						}).exec(geo.href) || { pathname: { groups: { latitude: null, longitude: null }}};

						const [latitude, longitude] = [parseFloat(lat), parseFloat(lng)];

						if (! (Number.isNaN(latitude) || Number.isNaN(longitude))) {
							url.searchParams.delete('geo');
							url.hash = `#${latitude},${longitude}`;
							location.hash = url.hash;
							history.replaceState(history.state, document.title, url.href);
							await Promise.all([
								customElements.whenDefined('leaflet-map'),
								customElements.whenDefined('leaflet-marker'),
							]);
							const map = document.querySelector('leaflet-map');
							const icon = 'https://cdn.kernvalley.us/img/adwaita-icons/actions/mark-location.svg';
							const title = 'Marked Location';
							await map.ready;
							map.setCenter({ latitude, longitude, title, icon });
						} else {
							url.searchParams.delete('geo');
							history.replaceState(history.state, document.title, url.href);
						}
					} catch(err) {
						console.error(err);
					}
					break;
				}

				case 'web+wfdplace:': {
					try {
						const { pathname: { groups: { identifier = null }}} = new URLPattern({
							protocol: 'web\\+wfdplace:',
							pathname: ':identifier',
						}).exec(geo.href) || { pathname: { groups: { identifier: null }}};

						if (typeof identifier === 'string' && identifier.length !== 0) {
							const marker = document.getElementById(identifier);
							url.searchParams.delete('geo');
							console.log({ identifier, marker, url: url.href});
							history.replaceState(history.state, document.title, url.href);

							if (marker instanceof HTMLElement && marker.tagName === 'LEAFLET-MARKER') {
								await Promise.all([
									customElements.whenDefined('leaflet-map'),
									customElements.whenDefined('leaflet-marker'),
								]);

								await marker.ready;
								marker.open = true;
							}
						}
					} catch(err) {
						console.error(err);
					}
					break;
				}

				default:
					console.error(`Unhandled URL protocol "${geo.protocol}"`);
					url.searchParams.delete('geo');
					history.replaceState(history.state, document.title, url.href);
			}
		} else if (url.searchParams.has('place')) {
			try {
				const { pathname: { groups: { identifier }}} = new URLPattern({
					protocol: 'web\\+wfdplace:',
					pathname: ':identifier',
				}).exec(url.searchParams.get('place')) || { pathname: { groups: { identifier: null }}};

				if (typeof identifier === 'string' && identifier.length !== 0) {
					const marker = document.getElementById(identifier);
					if (marker instanceof HTMLElement && marker.tagName === 'LEAFLET-MARKER') {
						const map = marker.closest('leaflet-map');
						await Promise.all([
							customElements.whenDefined('leaflet-map'),
							customElements.whenDefined('leaflet-marker'),
						]);
						await Promise.all([marker.ready, map.ready]);

						url.searchParams.delete('place');
						url.hash = `#${identifier}`;
						history.replaceState(history.state, marker.title, url.href);
						marker.hidden = false;
						marker.open = true;
					}
				} else {
					url.searchParams.remove('place');
					history.replaceState(history.state, document.title, url.href);
				}
			} catch(err) {
				console.error(err);
			}
		}
		const now = new Date();
		const current = isOnGoing();

		$('#main').css({ padding: '4px' });

		if (location.hash === '') {
			handlers.searchDateTimeRange({from: current ? new Date() : '2021-02-18T10:00'});
		}
		const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

		if ('geolocation' in navigator) {
			$('button[data-action="find-location"]').unhide();
		}

		$('form[name="eventSearch"]').submit(handlers.eventSearchHandler);
		$('form[name="businessSearch"]').submit(handlers.businessCategorySearch);
		$('toast-message > form').reset(({ target }) => target.closest('toast-message').close());

		$('#search-time').attr({ min: '06:00', max: '20:00' });
		$('#search-date').attr({
			value: current ? date : '2021-02-18',
			min: current ? date : '2021-02-18',
			max: '2021-02-20'
		});

		$('form[name="startDate"]').submit(nullSubmit);
		$('form[name="startDate"], form[name="search"]').reset(nullSubmit);
		$('form[name="search"]').submit(nullSubmit);
		$('form[name="markerFilter"]').submit(nullSubmit);

		filterEventNamesDatalist();
		searchLocationMarker();
	} else if (url.pathname.startsWith('/events')) {
		if (url.searchParams.has('event')) {
			try {
				const { pathname :{ groups: { identifier }}} = new URLPattern({
					protocol: 'web\\+wfdevent:',
					pathname: ':identifier',
				}).exec(url.searchParams.get('event')) || { pathname: { groups: { identifier: null }}};

				if (typeof identifier === 'string' && identifier.length !== 0) {
					const el = document.getElementById(identifier);
					if (el instanceof HTMLElement && el.hasAttribute('itemscope')) {
						el.scrollIntoView({ behavior: 'smooth', block: 'end' });
						url.searchParams.delete('event');
						url.hash = `#${identifier}`;
						document.title = el.querySelector('[itemprop="name"]').textContent;
						history.replaceState(history.state, document.title, url.href);
					}
				} else {
					url.searchParams.delete('event');
					history.replaceState(history.state, document.title, url.href);
				}
			} catch(err) {
				console.error(err);
				url.searchParams.delete('event');
				history.replaceState(history.state, document.title, url.href);
			}
		}
	}

	$('[data-action]').click(({ target }) => {
		const { action } = target.closest('[data-action]').dataset;
		switch (action.toLowerCase()) {
			case 'reload':
				location.reload();
				break;

			case 'back':
				history.back();
				break;

			case 'forward':
				history.forward();
				break;

			case 'find-location':
				document.querySelector('leaflet-map').locate().then(async function({ coords:  { latitude, longitude }}) {
					const marker = await createMarker({
						latitude,
						longitude,
						title: 'Current Location',
						body: `${latitude}, ${longitude} `,
					});
					marker.open = true;
					document.querySelector('leaflet-map').append(marker);
				});
				break;

			default:
				throw new Error(`Unknown click action: ${action}`);
		}
	});
});
