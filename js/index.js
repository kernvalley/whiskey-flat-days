import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/js/std-js/theme-cookie.js';
import 'https://unpkg.com/@webcomponents/custom-elements@1.4.2/custom-elements.min.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/leaflet/map.js';
import 'https://cdn.kernvalley.us/components/leaflet/marker.js';
import 'https://cdn.kernvalley.us/components/leaflet/geojson.js';
import 'https://cdn.kernvalley.us/components/not-supported.js';
import 'https://cdn.kernvalley.us/components/ad/block.js';
import 'https://cdn.kernvalley.us/components/weather/current.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/pwa/install.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
import { HTMLNotificationElement } from 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import * as handlers from './handlers.js';
import { $, ready, sleep } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadScript, preload } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { searchLocationMarker, stateHandler } from './functions.js';
import { site, GA } from './consts.js';

$(document.documentElement).toggleClass({
	'no-dialog': document.createElement('dialog') instanceof HTMLUnknownElement,
	'no-details': document.createElement('details') instanceof HTMLUnknownElement,
	'js': true,
	'no-js': false,
});

if (typeof GA === 'string' && GA !== '') {
	requestIdleCallback(async () => {
		importGa(GA).then(async ({ ga }) => {
			ga('create', GA, 'auto');
			ga('set', 'transport', 'beacon');
			ga('send', 'pageview');

			await ready();

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
}

cookieStore.get({ name: 'visited' }).then(async cookie => {
	if (new Date() < new Date('2021-02-18') && ! cookie) {
		await Promise.allSettled([
			ready(),
			preload('https://cdn.kernvalley.us/components/notification/html-notification.html', { as: 'fetch', type: 'text/html' }),
			preload('https://cdn.kernvalley.us/components/notification/html-notification.css', { as: 'style', type: 'text/css' }),
			preload('/img/favicon.svg', { as: 'image', type: 'image/svg+xml' }),
			preload('/img/adwaita-icons/status/dialog-warning.svg', { as: 'image', type: 'image/svg+xml' }),
		]);

		const notification = new HTMLNotificationElement('Outdated Info', {
			body: 'Whiskey Flat Days has been cancelled for 2021 due to COVID-19 and the inability to obtain the necessary permits',
			icon: '/img/favicon.svg',
			badge: '/img/adwaita-icons/status/dialog-warning.svg',
			requireInteraction: true,
			data: {
				cookie: {
					name: 'visited',
					value: 'yes',
					secure: true,
					expires: new Date('2021-02-18T00:00'),
				}
			},
			actions:[{
				title: 'Dismiss',
				action: 'dismiss',
			}]
		});

		notification.addEventListener('notificationclick', ({ action, target }) => {
			switch(action) {
				case 'dismiss':
					cookieStore.set(target.data.cookie);
					target.close();
					break;
			}
		});
	}
});

if (location.pathname.startsWith('/map')) {
	Promise.all([
		ready(),
		customElements.whenDefined('leaflet-map'),
		customElements.whenDefined('leaflet-marker'),
	]).then(async () => {
		window.addEventListener('popstate', stateHandler);

		if (history.state === null) {
			// Check if hash contains GPS coordinates
			if (location.hash.includes(',')) {
				const [latitude = NaN, longitude = NaN] = location.hash.substr(1).split(',', 2).map(parseFloat);
				if (! (Number.isNaN(latitude) || Number.isNaN(longitude))) {
					history.replaceState({
						latitude,
						longitude,
						title: 'Location',
						body: `GPS Coorinates: ${latitude}, ${longitude}`,
					}, `Location | ${site.title}`, location.href);
				}
				stateHandler(history);
			} else if (location.hash !== '') {
				// This is a marker with a UUID
				const marker = document.getElementById(location.hash.substr(1));

				if (marker instanceof HTMLElement && marker.tagName === 'LEAFLET-MARKER') {
					history.replaceState({
						latitude: marker.latitude,
						longitude: marker.longitude,
						title: marker.title,
						uuid: marker.id,
					}, `${marker.title} | ${site.title}`, location.href);
					stateHandler(history);
				}
			}
		} else {
			stateHandler(history);
		}
	});
} else if (location.pathname.startsWith('/events') && ('IntersectionObserver' in window)) {
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

function filterEventNamesDatalist() {
	const datalist = document.getElementById('events-list');

	if (datalist instanceof HTMLElement) {
		const opts = new Set();

		[...datalist.options].forEach(opt => {
			opts.add(opt.value);
			opt.remove();
		});

		opts.forEach(opt => {
			const el = document.createElement('option');
			el.value = opt;
			datalist.append(el);
		});
	}
}

function isOnGoing() {
	const start = new Date('2020-02-14T08:00');
	const end = new Date('2020-02-17T16:00');
	const now = new Date();
	return (now > start && now < end);
}

Promise.all([
	loadScript('https://cdn.polyfill.io/v3/polyfill.min.js'),
	ready(),
]).then(async () => {
	init().catch(console.error);
	const now = new Date();
	const current = isOnGoing();
	if (location.hash === '') {
		handlers.searchDateTimeRange({from: current ? new Date() : '2020-02-14T10:00'});
	}
	const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

	if (location.pathname.startsWith('/map') && ('geolocation' in navigator) && navigator.geolocation.getCurrentPosition instanceof Function) {
		$('button[data-action="find-location"]').unhide();
	}

	$('form[name="eventSearch"]').submit(handlers.eventSearchHandler);
	$('form[name="businessSearch"]').submit(handlers.businessCategorySearch);
	$('toast-message > form').reset(({target}) => target.closest('toast-message').close());

	$('#search-time').attr({ min: '06:00', max: '20:00' });
	$('#search-date').attr({ value: current ? date : '2020-02-14', min: current ? date : '2020-02-14', max: '2020-02-17' });

	$('leaflet-marker[id]').on('markerclick', async ({target}) => {
		await sleep(100);

		if (target.open) {
			const url = new URL(location.pathname, location.origin);
			document.title = `${target.title} | ${site.title}`;

			if (typeof target.id === 'string') {
				url.hash = `#${target.id}`;
			}

			history.pushState({
				latitude: target.latitude,
				longitude: target.longitude,
				title: target.title,
				uuid: target.id,
			}, document.title, url.href);
		}
	});

	$('form[name="startDate"]').submit(handlers.startDateSearch);
	$('form[name="startDate"], form[name="search"]').reset(handlers.searchReset);
	$('form[name="search"]').submit(handlers.searchSubmit);
	$('form[name="markerFilter"]').submit(handlers.filterMarkersSubmit);

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
				if (('geolocation' in navigator) && navigator.geolocation.getCurrentPosition instanceof Function) {
					navigator.geolocation.getCurrentPosition(({coords}) => {
						const url = new URL(location.pathname, location.origin);
						document.title = `Location: ${site.title}`;
						url.hash = `${coords.latitude},${coords.longitude}`;
						history.pushState({
							latitude: coords.latitude,
							longitude: coords.longitude,
							title: 'Location',
							body: `GPS Coordinates: ${coords.latitude}, ${coords.longitude}`
						}, document.title, url.href);
						stateHandler(history);
					}, console.error, {
						enableHighAccuracy: true,
					});
				}
				break;

			default:
				throw new Error(`Unknown click action: ${action}`);
		}
	});

	filterEventNamesDatalist();
	searchLocationMarker();
});
