import '@shgysk8zer0/kazoo/theme-cookie.js';
import { init } from '@shgysk8zer0/kazoo/data-handlers.js';
import { debounce } from '@shgysk8zer0/kazoo/events.js';
import { URLPattern as URLPatternShim } from 'urlpattern-polyfill';
import {
	searchDateTimeRange, eventSearchHandler, businessCategorySearch,
} from './handlers.js';
import { shareInit } from '@shgysk8zer0/kazoo/data-share.js';
import {
	ready, loaded, css, on, toggleClass, intersect, attr,
} from '@shgysk8zer0/kazoo/dom.js';
import { getCustomElement } from '@shgysk8zer0/kazoo/custom-elements.js';
import { importGa, externalHandler, telHandler, mailtoHandler } from '@shgysk8zer0/kazoo/google-analytics.js';
import { DAYS } from '@shgysk8zer0/kazoo/date-consts.js';
import {
	searchLocationMarker, createMarker, isOnGoing, filterEventNamesDatalist,
	intersectCallback, getPages, findNextEvent, showGoogleCalendarModal,
} from './functions.js';
import { getGooglePolicy, getDefaultPolicyWithDisqus } from '@shgysk8zer0/kazoo/trust-policies.js';
import { createPolicy } from '@shgysk8zer0/kazoo/trust.js';
import { createYouTubeEmbed } from '@shgysk8zer0/kazoo/youtube.js';
import { GA } from './consts.js';
import './components.js';
import './store.js';
import './profile.js';

getDefaultPolicyWithDisqus();

if (! ('URLPattern' in globalThis)) {
	globalThis.URLPattern = URLPatternShim;
}

if (! CSS.supports('height', '1dvh')) {
	css(document.documentElement, { '--viewport-height': `${window.innerHeight}px`});

	on(window, 'resize', debounce(() => {
		css(document.documentElement, { '--viewport-height': `${window.innerHeight}px`});
	}), { passive: true });
}

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

toggleClass(document.documentElement, {
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

loaded().then(() => {
	if (typeof GA === 'string' && GA !== '') {
		requestIdleCallback(async () => {
			importGa(GA, {}, { policy: getGooglePolicy() }).then(async ({ ga }) => {
				ga('create', GA, 'auto');
				ga('set', 'transport', 'beacon');
				ga('send', 'pageview');

				on('a[rel~="external"]', 'click', externalHandler, { passive: true, capture: true });
				on('a[href^="tel:"]', 'click', telHandler, { passive: true, capture: true });
				on('a[href^="mailto:"]', 'click', mailtoHandler, { passive: true, capture: true });
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
	} else {
		createPolicy('ga#script-url', {});
		createPolicy('goog#htm', {});
	}
});

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.ready.then(async reg => {
		if ('periodicSync' in reg && 'permissions' in navigator) {
			const { state } = await navigator.permissions.query({ name: 'periodic-background-sync' });

			if (state === 'granted') {
				reg.periodicSync.register('main-assets', { minInterval: 7 *  DAYS }).catch(console.error);
				reg.periodicSync.register('pinned-pages', { minInterval: 2 * DAYS }).catch(console.error);
				reg.periodicSync.register('recent-posts', { minInterval: DAYS }).catch(console.error);
			}
		}
	});
}

if (location.pathname.startsWith('/events') && ('IntersectionObserver' in globalThis)) {
	ready().then(() => {
		intersect('.event-item', intersectCallback);
	});
} else if (location.pathname.startsWith('/news/') && ('IntersectionObserver' in globalThis)) {
	ready().then(() => {
		intersect('.post-preview', intersectCallback);
	});
}

Promise.all([
	getCustomElement('install-prompt'),
	new URL(location.href),
	getPages(),
	ready(),
]).then(async ([HTMLInstallPromptElement, url, { events, map, mayors }]) => {
	init();

	on('#install-btn', 'click', () => new HTMLInstallPromptElement().show());
	attr('#install-btn', { hidden: false });

	globalThis.scheduler.postTask(() => {
		intersect('[data-video]', ({ target, isIntersecting }, observer) => {
			if (isIntersecting) {
				const { video, width = '560', height = '315', title = '' } = target.dataset;
				const iframe = createYouTubeEmbed(video, {
					fetchPriority: 'high',
					height: parseInt(height),
					width: parseInt(width),
					loading: 'eager',
					title,
				});

				target.replaceChildren(iframe);
				observer.unobserve(target);
			}
		});
	}, {
		priority: 'background',
	});

	if (url.pathname.startsWith(map.url.pathname)) {
		if (! ['', '#', '#main'].includes(location.hash)) {
			document.getElementById('main').scrollIntoView({ block: 'start', behavior: 'smooth' });
		}

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

		css('#main', { padding: '4px' });

		if (location.hash === '') {
			searchDateTimeRange({from: current ? new Date() : '2022-02-18T10:00'});
		}
		const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

		if ('geolocation' in navigator) {
			attr('button[data-action="find-location"]', { hidden: false });
		}

		on('form[name="eventSearch"]', 'submit', eventSearchHandler);
		on('form[name="businessSearch"]', 'submit', businessCategorySearch);
		on('toast-message > form', 'reset', ({ target }) => target.closest('toast-message').close());

		attr('#search-time', { min: '06:00', max: '21:00' });
		attr('#search-date', {
			value: current ? date : '2023-02-17',
			min: current ? date : '2023-02-17',
			max: '2023-02-20'
		});

		on('form[name="startDate"]', nullSubmit);
		on('form[name="startDate"], form[name="search"]','reset', nullSubmit);
		on('form[name="search"]', 'submit', nullSubmit);
		on('form[name="markerFilter"]', 'submit', nullSubmit);

		filterEventNamesDatalist();
		searchLocationMarker();
	} else if (url.pathname.startsWith(events.url.pathname)) {
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
		} else if (location.hash.length  < 2) {
			try {
				const eventEl = findNextEvent(document.getElementById('main'));
				
				if (eventEl instanceof Element) {
					eventEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
					location.hash = `#${eventEl.id}`;
				}
			} catch(err) {
				console.error(err);
			}
		}
	} else if (location.pathname.startsWith(mayors.url.pathname)) {
		on('[data-calendar-id]', 'click', ({ currentTarget }) => {
			showGoogleCalendarModal(currentTarget.dataset.calendarId);
		});
	}

	on('[data-action]', 'click', ({ target }) => {
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
