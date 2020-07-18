import { loaded, wait, $ } from 'https://cdn.kernvalley.us/js/std-js/functions.js';
import { site } from './consts.js';
import { getMap, createMarker } from './functions.js';

export function  searchDateTimeRange({from = new Date('2020-02-14T11:00'), hours = 2} = {}) {
	if (! (from instanceof Date)) {
		from = new Date(from) || new Date();
	}

	if (typeof hours !== 'number') {
		hours = parseInt(hours);
	}

	if (Number.isNaN(hours)) {
		hours = 1;
	}

	let to = new Date(from.toISOString());
	to.setHours(to.getHours() + hours);

	[...document.querySelectorAll('leaflet-marker.event-marker')].forEach(event => {
		const start = new Date(event.dataset.startDate);
		const end = new Date(event.dataset.endDate);
		event.hidden = ! (end >= from && start <= to);
	});
}

export async function eventSearchHandler(event) {
	event.preventDefault();
	const form = event.target;
	const toast = form.closest('toast-message');
	const data = new FormData(form);
	const from = new Date(`${data.get('day')}T${data.get('time')}`);
	searchDateTimeRange({from});
	const open = document.querySelectorAll('leaflet-marker.event-marker:not([hidden])');

	if (open.length === 1) {
		open.item(0).open = true;
	}

	toast.close();
}

export async function hashChange() {
	if (! location.pathname.startsWith('/map')) {
		return;
	} else if (location.hash === '') {
		document.title = `Map | ${site.title}`;
		history.replaceState({
			title: 'Map',
			latitude: NaN,
			longitude: NaN,
			uuid: null,
		}, document.title, location.href);

		$('leaflet-marker[open]').attr({open: false});
	} else if (! location.hash.includes(',')) {
		$('leaflet-geojson').hide();
		$('leaflet-marker').close();

		const marker = document.getElementById(location.hash.substr(1));

		if (marker instanceof HTMLElement) {
			const map = marker.parentElement;

			if (marker.title !== '') {
				document.title = `${marker.title} |${site.title}`;
			} else {
				document.title = `Map | ${site.title}`;
			}

			switch(marker.tagName.toLowerCase()) {
				case 'leaflet-marker':
					history.replaceState({
						latitude: marker.latitude,
						longitude: marker.longitude,
						uuid: location.hash.substr(1),
						title: marker.title,
					}, document.title, location.href);

					(async () => {
						map.center = {latitude: marker.latitude, longitude: marker.longitude};
						map.scrollIntoView({behavior: 'smooth', block: 'start'});
						const geojson = map.querySelector(`leaflet-geojson[marker="${marker.id}"]`);
						await Promise.all([marker.ready, map.ready, loaded()]);
						await wait(100);
						marker.hidden = false;
						marker.open = true;

						if (geojson instanceof HTMLElement) {
							geojson.hidden = false;
						}
					})();
					break;

				case 'leaflet-geojson':
					map.scrollIntoView({behavior: 'smooth', block: 'start'});
					marker.hidden = false;
					break;
			}
		}
	} else if (location.hash.includes(',')) {
		const [latitude = NaN, longitude = NaN] = location.hash.substr(1).split(',').map(parseFloat);
		const map = await getMap();
		await $('#my-location-marker', map).remove();
		const marker = await createMarker({
			latitude,
			longitude,
			size: 42,
			body: 'Marked Location',
			id: 'my-location-marker',
		});

		document.title = `Marked Location | ${site.title}`;
		history.replaceState({
			longitude,
			latitude,
			uuid: null,
			title: document.title,
		}, document.title, location.href);
		map.center = {latitude, longitude};
		map.scrollIntoView({behavior: 'smooth', block: 'start'});
		await wait(200);
		marker.open = true;
	}
}

export async function businessCategorySearch(event) {
	event.preventDefault();
	const form = event.target;
	const toast = form.closest('toast-message');
	const data = new FormData(form);
	const category = data.get('category').toLowerCase();

	if (typeof category === 'string' && category !== '') {
		$('leaflet-marker.business-marker[data-category]').forEach(marker => {
			marker.hidden = !marker.dataset.category.toLowerCase().includes(category);
		});
	} else {
		$('leaflet-marker.business-marker').unhide();
	}

	if (toast instanceof HTMLElement) {
		toast.close();
	}
}
