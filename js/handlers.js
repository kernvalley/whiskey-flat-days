import {loaded, ready, wait} from 'https://cdn.kernvalley.us/js/std-js/functions.js';

export async function hashChange() {
	if (location.hash !== '' && ! location.hash.includes(',')) {
		const marker = document.getElementById(location.hash.substr(1));

		if (marker instanceof HTMLElement && marker.tagName.toLowerCase() === 'map-marker') {
			const map = marker.parentElement;
			map.center = {latitude: marker.latitude, longitude: marker.longitude};
			map.scrollIntoView({behavior: 'smooth', block: 'start'});
			await Promise.all([marker.ready, map.ready, loaded()]);
			await wait(100);
			marker.open = true;
		}
	} else if (location.hash.includes(',')) {
		await ready();
		const Marker = customElements.get('map-marker');
		const [latitude, longitude] = location.hash.substr(1).split(',').map(parseFloat);
		const marker = new Marker();
		const icon = document.createElement('img');
		const map = document.querySelector('open-street-map');
		marker.latitude = latitude;
		marker.longitude = longitude;
		marker.slot = 'markers';
		icon.src = new URL('/img/adwaita-icons/actions/mark-location.svg', document.baseURI);
		icon.width = 42;
		icon.height = 42;
		icon.slot = 'icon';
		marker.append(icon);
		map.append(marker);
		map.center = {latitude, longitude};
	}
}
