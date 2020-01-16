import 'https://cdn.kernvalley.us/js/std-js/deprefixer.js';
import 'https://cdn.kernvalley.us/js/std-js/shims.js';
import 'https://cdn.kernvalley.us/components/share-button.js';
import 'https://cdn.kernvalley.us/components/current-year.js';
import 'https://cdn.kernvalley.us/components/bacon-ipsum.js';
import 'https://cdn.kernvalley.us/components/gravatar-img.js';
import 'https://cdn.kernvalley.us/components/login-button.js';
import 'https://cdn.kernvalley.us/components/logout-button.js';
import HTMLOpenStreetMapElement from 'https://cdn.kernvalley.us/components/open-street-map.js';
import {$, ready, loaded, wait, registerServiceWorker} from 'https://cdn.kernvalley.us/js/std-js/functions.js';

customElements.define(HTMLOpenStreetMapElement.tagName, HTMLOpenStreetMapElement);

if (document.documentElement.dataset.hasOwnProperty('serviceWorker')) {
	registerServiceWorker(document.documentElement.dataset.serviceWorker).catch(console.error);
}

document.documentElement.classList.replace('no-js', 'js');
document.body.classList.toggle('no-dialog', document.createElement('dialog') instanceof HTMLUnknownElement);
document.body.classList.toggle('no-details', document.createElement('details') instanceof HTMLUnknownElement);

customElements.whenDefined('map-marker').then(async () => {
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
	}
});

ready().then(async () => {
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
});
