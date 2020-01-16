import {loaded, wait} from 'https://cdn.kernvalley.us/js/std-js/functions.js';

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
		await loaded();
		await Promise.all(['share-button', 'map-marker'].map(tag => customElements.whenDefined(tag)));
		const Marker = customElements.get('map-marker');
		const Share = customElements.get('share-button');
		const [latitude, longitude] = location.hash.substr(1).split(',').map(parseFloat);
		const marker = new Marker();
		const icon = document.createElement('img');
		const map = document.querySelector('open-street-map');
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
