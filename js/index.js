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
import 'https://cdn.kernvalley.us/components/pwa/install.js';
import 'https://cdn.kernvalley.us/components/app/list-button.js';
import 'https://cdn.kernvalley.us/components/app/stores.js';
import { HTMLNotificationElement } from 'https://cdn.kernvalley.us/components/notification/html-notification.js';
import { init } from 'https://cdn.kernvalley.us/js/std-js/data-handlers.js';
import * as handlers from './handlers.js';
import { $ } from 'https://cdn.kernvalley.us/js/std-js/esQuery.js';
import { ready, loaded } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { getCustomElement } from 'https://cdn.kernvalley.us/js/std-js/custom-elements.js';
import { preload } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from 'https://cdn.kernvalley.us/js/std-js/google-analytics.js';
import { searchLocationMarker, createMarker, isOnGoing,filterEventNamesDatalist } from './functions.js';
import { GA } from './consts.js';

$(document.documentElement).toggleClass({
	'no-dialog': document.createElement('dialog') instanceof HTMLUnknownElement,
	'no-details': document.createElement('details') instanceof HTMLUnknownElement,
	'js': true,
	'no-js': false,
});

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

if (location.pathname.startsWith('/map')) {
	cookieStore.get({ name: 'visited' }).then(async cookie => {
		if (new Date() < new Date('2021-02-18') && ! cookie) {
			await Promise.allSettled([
				ready(),
				preload('https://cdn.kernvalley.us/components/notification/html-notification.html', { as: 'fetch', type: 'text/html' }),
				preload('https://cdn.kernvalley.us/components/notification/html-notification.css', { as: 'style', type: 'text/css' }),
				preload('/img/adwaita-icons/status/dialog-warning.svg', { as: 'image', type: 'image/svg+xml' }),
			]);

			new HTMLNotificationElement('WFD cancelled', {
				body: 'Whiskey Flat Days has been cancelled for 2021 due to COVID-19 and the inability to obtain the necessary permits',
				icon: '/img/favicon.svg',
				badge: 'https://cdn.kernvalley.us/img/adwaita-icons/status/dialog-warning.svg',
				requireInteraction: true,
				data: {
					cookie: {
						name: 'visited',
						value: 'yes',
						secure: true,
						expires: new Date('2021-02-18T00:00').getTime(),
					}
				},
				actions:[{
					title: 'Dismiss',
					action: 'dismiss',
					icon: 'https://cdn.kernvalley.us/img/octicons/x.svg',
				}]
			}).addEventListener('notificationclick', ({ action, target }) => {
				switch(action) {
					case 'dismiss':
						cookieStore.set(target.data.cookie);
						target.close();
						break;
				}
			});
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

Promise.all([
	getCustomElement('install-prompt'),
	ready(),
]).then(async ([HTMLInstallPromptElement]) => {
	init();

	$('#install-btn').click(() => new HTMLInstallPromptElement().show()).then($btns => $btns.unhide());

	if (location.pathname.startsWith('/map')) {
		const now = new Date();
		const current = isOnGoing();
		if (location.hash === '') {
			handlers.searchDateTimeRange({from: current ? new Date() : '2020-02-14T10:00'});
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
			value: current ? date : '2020-02-14',
			min: current ? date : '2020-02-14',
			max: '2020-02-17'
		});

		$('form[name="startDate"]').submit(handlers.startDateSearch);
		$('form[name="startDate"], form[name="search"]').reset(handlers.searchReset);
		$('form[name="search"]').submit(handlers.searchSubmit);
		$('form[name="markerFilter"]').submit(handlers.filterMarkersSubmit);

		filterEventNamesDatalist();
		searchLocationMarker();
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
