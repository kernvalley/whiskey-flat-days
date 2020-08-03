import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://unpkg.com/@webcomponents/custom-elements@1.4.2/custom-elements.min.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/leaflet/map.js';
import 'https://cdn.kernvalley.us/components/leaflet/marker.js';
import 'https://cdn.kernvalley.us/components/leaflet/geojson.js';
import 'https://cdn.kernvalley.us/components/not-supported.js';
import 'https://cdn.kernvalley.us/components/ad-block.js';
import 'https://cdn.kernvalley.us/components/weather-current.js';
import 'https://cdn.kernvalley.us/components/github/user.js';
import 'https://cdn.kernvalley.us/components/pwa/install.js';
import * as handlers from './handlers.js';
import { $, ready, wait } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { loadScript } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { searchLocationMarker, stateHandler } from './functions.js';
import { site } from './consts.js';

document.documentElement.classList.replace('no-js', 'js');
document.body.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
document.body.classList.toggle('no-details', document.createElement('details') instanceof HTMLUnknownElement);

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
	loadScript('https://polyfill.io/v3/polyfill.min.js'),
	ready(),
]).then(async () => {
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
		await wait(100);

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

	$('[data-scroll-to]').click(event => {
		const target = document.querySelector(event.target.closest('[data-scroll-to]').dataset.scrollTo);
		target.scrollIntoView({
			bahavior: 'smooth',
			block: 'start',
		});
	});

	$('[data-show]').click(event => {
		const target = document.querySelector(event.target.closest('[data-show]').dataset.show);
		if (target instanceof HTMLElement) {
			target.show();
		}
	});

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

	$('[data-show-modal]').click(event => {
		const target = document.querySelector(event.target.closest('[data-show-modal]').dataset.showModal);
		if (target instanceof HTMLElement) {
			target.showModal();
		}
	});

	$('[data-close]').click(event => {
		const target = document.querySelector(event.target.closest('[data-close]').dataset.close);
		if (target instanceof HTMLElement) {
			target.tagName === 'DIALOG' ? target.close() : target.open = false;
		}
	});

	filterEventNamesDatalist();
	searchLocationMarker();
});


