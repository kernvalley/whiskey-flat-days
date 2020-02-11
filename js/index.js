import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/bacon-ipsum.js';
import 'https://cdn.kernvalley.us/components/gravatar-img.js';
import 'https://cdn.kernvalley.us/components/login-button.js';
import 'https://cdn.kernvalley.us/components/logout-button.js';
import 'https://cdn.kernvalley.us/components/leaflet/map.js';
import 'https://cdn.kernvalley.us/components/leaflet/marker.js';
import 'https://cdn.kernvalley.us/components/leaflet/geojson.js';
import 'https://cdn.kernvalley.us/components/not-supported.js';
import 'https://cdn.kernvalley.us/components/network-offline.js';
import 'https://cdn.kernvalley.us/components/network-online.js';
import 'https://cdn.kernvalley.us/components/ad-block.js';
import 'https://cdn.kernvalley.us/components/weather-current.js';
import * as handlers from './handlers.js';
import { $, ready, registerServiceWorker } from 'https://cdn.kernvalley.us/js/std-js/functions.js';

if (document.documentElement.dataset.hasOwnProperty('serviceWorker')) {
	registerServiceWorker(document.documentElement.dataset.serviceWorker).catch(console.error);
}

document.documentElement.classList.replace('no-js', 'js');
document.body.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
document.body.classList.toggle('no-details', document.createElement('details') instanceof HTMLUnknownElement);
handlers.hashChange();

window.addEventListener('hashchange', handlers.hashChange);

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
	const start = new Date('2020-02-14T08:00-08');
	const end = new Date('2020-02-17T16:00-08');
	const now = new Date();
	return start > now && end < now;
}

ready().then(async () => {
	const now = new Date();
	const current = isOnGoing();
	const date = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;

	$('#search-time').attr({ min: '06:00', max: '20:00' });
	$('#search-date').attr({ value: current ? date : '2020-02-14', min: current ? date : '2020-02-14', max: '2020-02-17' });

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
});
