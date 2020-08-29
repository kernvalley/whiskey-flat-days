---
layout: null
---
/* eslint-env serviceworker */
/* eslint no-unused-vars: 0*/
'use strict';

const config = {
	version: '{{ site.data.app.version | default: site.version }}',
	fresh: [
		/* Root document */
		'{{ site.pages | where: "pinned", true | map: "url" | join: "', '" }}',
		// 'https://baconipsum.com/api/?paras=4&format=json&type=all-meat',
		'https://api.openweathermap.org/data/2.5/weather?appid=41ff0542577756523c5fcfaaeabe89d7&zip=93238%2Cus&units=imperial&lang=en',
	].map(path => new URL(path, location.origin).href),
	stale: [
		'/css/index.min.css',
		'/js/index.min.js',
		'/img/icons.svg',
		'https://cdn.polyfill.io/v3/polyfill.min.js',
		/* Other HTML */

		/* JS, `customElements`, etc. */
		'https://cdn.kernvalley.us/components/toast-message.html',
		'https://cdn.kernvalley.us/components/pwa/prompt.html',
		'https://cdn.kernvalley.us/components/leaflet/map.html',
		'https://cdn.kernvalley.us/components/weather-current.html',

		/* CSS */
		'https://unpkg.com/leaflet@1.6.0/dist/leaflet.css',
		'https://cdn.kernvalley.us/components/toast-message.css',
		'https://cdn.kernvalley.us/components/pwa/prompt.css',
		'https://cdn.kernvalley.us/components/leaflet/map.css',
		'https://cdn.kernvalley.us/components/weather-current.css',

		/* Images & Icons */
		'/img/apple-touch-icon.png',
		'/img/icon-192.png',
		'/img/favicon.svg',
		'https://cdn.kernvalley.us/img/adwaita-icons/actions/mail-send.svg',
		'https://cdn.kernvalley.us/img/adwaita-icons/actions/mark-location.svg',
		'https://cdn.kernvalley.us/img/octicons/file-media.svg',
		'https://cdn.kernvalley.us/img/logos/firefox.svg',
		'https://cdn.kernvalley.us/img/logos/chrome.svg',
		'https://cdn.kernvalley.us/img/keep-kern-clean.svg',
		/* Map Icons */
		'/img/markers/activity.svg',
		'/img/markers/atm.svg',
		'/img/markers/bar.svg',
		'/img/markers/bus.svg',
		'/img/markers/business.svg',
		'/img/markers/cafe.svg',
		'/img/markers/event.svg',
		'/img/markers/hotel.svg',
		'/img/markers/parking.svg',
		'/img/markers/restaurant.svg',
		'/img/markers/shopping.svg',
		'/img/markers/store.svg',
		'/img/markers/train.svg',
		'/img/markers/gas.svg',
		'/img/markers/hospital.svg',
		'/img/markers/pizza.svg',
		'/img/markers/music.svg',
		'/img/markers/outhouse.svg',
		'/img/markers/florist.svg',
		'/img/markers/museum.svg',
		'/img/octicons/info.svg',
		'/img/adwaita-icons/status/avatar-default.svg',

		/* Event Images */
		'/img/raster/rodeo.jpg',
		'/img/raster/parade.jpg',
		'/img/raster/encampment.jpg',
		'/img/raster/coach-320.jpg',

		/* Social Icons for Web Share API shim */
		'https://cdn.kernvalley.us/img/octicons/mail.svg',
		'https://cdn.kernvalley.us/img/logos/facebook.svg',
		'https://cdn.kernvalley.us/img/logos/twitter.svg',
		'https://cdn.kernvalley.us/img/logos/google-plus.svg',
		'https://cdn.kernvalley.us/img/logos/linkedin.svg',
		'https://cdn.kernvalley.us/img/logos/reddit.svg',
		'https://cdn.kernvalley.us/img/logos/gmail.svg',
		'https://cdn.kernvalley.us/img/logos/instagram.svg',
		'https://cdn.kernvalley.us/img/octicons/clippy.svg',

		/* Fonts */
		'https://cdn.kernvalley.us/fonts/roboto.woff2',
		'https://cdn.kernvalley.us/fonts/Libertine.woff',
		'https://cdn.kernvalley.us/fonts/ubuntu.woff2',
		/* Other */
	].map(path => new URL(path, location.origin).href),
	allowed: [
		/https:\/\/secure\.gravatar\.com\/avatar\/*/,
		/https:\/\/i\.imgur\.com\/*/,
		/https:\/\/maps\.wikimedia\.org\/osm-intl\/*/,
		/https:\/\/cdn\.kernvalley\.us\/img\/*/,
		/https:\/\/api\.openweathermap\.org\/data\/*/,
		new RegExp(`${location.origin.replace('/', '\\/').replace('.', '\\.')}\\/paths\\/.*`),
		new RegExp(`${location.origin.replace('/', '\\/').replace('.', '\\.')}\\/img\\/raster\\/.*`),
		new RegExp(`${location.origin.replace('/', '\\/').replace('.', '\\.')}\\/img\\/markers\\/.*`),
	],
};
