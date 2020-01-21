import {loaded, wait, $} from 'https://cdn.kernvalley.us/js/std-js/functions.js';

export async function startDateSearch(event) {
	let date;
	const markers = [...document.querySelectorAll('.event-marker')];

	if (event instanceof Event) {
		event.preventDefault();
		const data = new FormData(event.target);
		date = new Date(`${data.get('date')}T${data.get('time')}`);
	} else {
		date = new Date();
	}

	markers.forEach(marker => {
		const start = new Date(marker.dataset.startDate);
		const end = new Date(marker.dataset.endDate);
		marker.hidden = date < start || date > end;
	});
}

export async function hashChange() {
	if (location.hash !== '' && ! location.hash.includes(',')) {
		$('leaflet-geojson').hide();
		$('leaflet-marker').close();
		const marker = document.getElementById(location.hash.substr(1));

		if (marker instanceof HTMLElement) {
			const map = marker.parentElement;
			switch(marker.tagName.toLowerCase()) {
			case 'leaflet-marker':
				map.center = {latitude: marker.latitude, longitude: marker.longitude};
				map.scrollIntoView({behavior: 'smooth', block: 'start'});
				await Promise.all([marker.ready, map.ready, loaded()]);
				await wait(100);
				marker.open = true;
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
		const Share = customElements.get('share-button');
		const [latitude, longitude] = location.hash.substr(1).split(',').map(parseFloat);
		const marker = new Marker();
		const icon = document.createElement('img');
		const map = document.querySelector('leaflet-map');
		const popup = document.createElement('div');
		const share = new Share();

		share.url = location.href;
		share.textContent = 'Share Location';
		share.title = 'My location | Whiskey Flat Days Map';

		marker.latitude = latitude;
		marker.longitude = longitude;
		marker.slot = 'markers';

		icon.src = new URL('/img/adwaita-icons/actions/mark-location.svg', document.baseURI);
		icon.width = 42;
		icon.height = 42;
		icon.slot = 'icon';

		popup.slot = 'popup';
		popup.textContent = 'Marked Location';
		popup.append(document.createElement('br'), share);

		marker.append(icon, popup);
		map.append(marker);
		map.center = {latitude, longitude};
		map.scrollIntoView({behavior: 'smooth', block: 'start'});
		await wait(200);
		marker.open = true;
	}
}

export async function search(event) {
	event.preventDefault();
	const data = new FormData(event.target);
	const term = data.get('term').toLowerCase();
	const markers = [...document.querySelectorAll('.event-marker')];
	const marker = markers.find(el => el.title.toLowerCase().startsWith(term));

	if (marker instanceof HTMLElement) {
		marker.hidden = false;
		marker.open = true;
	}
}

export async function searchReset() {
	const date = new Date();
	const markers = [...document.querySelectorAll('.event-marker')];

	markers.forEach(marker => {
		const start = new Date(marker.dataset.startDate);
		const end = new Date(marker.dataset.endDate);
		marker.hidden = date < start || date > end;
	});
}

export async function filterMarkersSubmit(event) {
	event.preventDefault();
	const data = new FormData(event.target);

	if (data.has('event-marker')) {
		$('.event-marker').unhide();
	} else {
		$('.event-marker').hide();
	}

	if (data.has('vendor-marker')) {
		$('.vendor-marker').unhide();
	} else {
		$('.vendor-marker').hide();
	}

	if (data.has('business-marker')) {
		$('.business-marker').unhide();
	} else {
		$('.business-marker').hide();
	}
}
