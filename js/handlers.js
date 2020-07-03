import {loaded, wait, $} from 'https://cdn.kernvalley.us/js/std-js/functions.js';

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
	if (location.hash === '') {
		document.title = 'Map | Whiskey Flat Days';
		$('leaflet-marker[open]').attr({open: false});
	} else if (! location.hash.includes(',')) {
		$('leaflet-geojson').hide();
		$('leaflet-marker').close();

		const marker = document.getElementById(location.hash.substr(1));

		if (marker instanceof HTMLElement) {
			const map = marker.parentElement;

			if (marker.title !== '') {
				document.title = `${marker.title} | Whiskey Flat Days`;
			} else {
				document.title = 'Map | Whiskey Flat Days';
			}

			switch(marker.tagName.toLowerCase()) {
			case 'leaflet-marker':
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
		await loaded();
		await Promise.all(['share-button', 'leaflet-marker'].map(tag => customElements.whenDefined(tag)));
		const Marker = customElements.get('leaflet-marker');
		const [latitude, longitude] = location.hash.substr(1).split(',').map(parseFloat);
		const marker = new Marker();
		const icon = document.createElement('img');
		const map = document.querySelector('leaflet-map');
		const popup = document.createElement('div');

		marker.id = 'my-location-marker';
		marker.latitude = latitude;
		marker.longitude = longitude;
		marker.slot = 'markers';

		icon.src = new URL('/img/adwaita-icons/actions/mark-location.svg', document.baseURI);
		icon.width = 42;
		icon.height = 42;
		icon.slot = 'icon';
		document.title = 'Marked Location | Whiskey Flat Days';

		popup.slot = 'popup';
		popup.textContent = 'Marked Location';

		if (navigator.share instanceof Function) {
			try {
				const Share = customElements.get('share-button');
				const share = new Share();

				share.url = location.href;
				share.textContent = 'Share Location';
				share.title = 'My location | Whiskey Flat Days Map';
				popup.append(document.createElement('br'), share);
			} catch(err) {
				console.error(err);
			}
		}

		marker.append(icon, popup);
		await $('#my-location-marker').remove();
		map.append(marker);
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
