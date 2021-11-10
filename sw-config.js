---
layout: null
---
/* eslint-env serviceworker */
/* eslint no-unused-vars: 0*/
'use strict';

const config = {
	version: '{{ site.data.app.version | default: site.version }}',
	fresh: [
		'{{ site.pages | where: "pinned", true | map: "url" | join: "', '" }}',
		'/manifest.json',
		'https://apps.kernvalley.us/apps.json',
		'https://cdn.kernvalley.us/img/markers.svg',
	].map(path => new URL(path, location.origin).href),
	stale: [
		/* Scripts */
		'/js/index.min.js',
		'https://cdn.kernvalley.us/components/leaflet/map.min.js',

		/* Custom Element Templates */
		'https://cdn.kernvalley.us/components/toast-message.html',
		'https://cdn.kernvalley.us/components/pwa/prompt.html',
		'https://cdn.kernvalley.us/components/leaflet/map.html',
		'https://cdn.kernvalley.us/components/weather/current.html',
		'https://cdn.kernvalley.us/compoents/install/prompt.html',
		'https://cdn.kernvalley.us/components/share-to-button/share-to-button.html',

		/* CSS */
		'/css/index.min.css',
		'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css',
		'https://cdn.kernvalley.us/components/toast-message.css',
		'https://cdn.kernvalley.us/components/pwa/prompt.css',
		'https://cdn.kernvalley.us/components/leaflet/map.css',
		'https://cdn.kernvalley.us/components/weather/current.css',
		'https://cdn.kernvalley.us/compoents/install/prompt.css',
		'https://cdn.kernvalley.us/components/share-to-button/share-to-button.css',

		/* Images & Icons */
		'/img/icons.svg',
		'/img/apple-touch-icon.png',
		'/img/icon-192.png',
		'/img/favicon.svg',
		'https://cdn.kernvalley.us/img/logos/firefox.svg',
		'https://cdn.kernvalley.us/img/logos/chrome.svg',
		'https://cdn.kernvalley.us/img/keep-kern-clean.svg',
		'https://cdn.kernvalley.us/img/logos/play-badge.svg',
		'/img/octicons/info.svg',
		'/img/adwaita-icons/status/avatar-default.svg',

		/* Event Images */
		'/img/raster/rodeo.jpg',
		'/img/raster/parade.jpg',
		'/img/raster/encampment.jpg',
		'/img/raster/coach-320.jpg',

		/* Fonts */
		'https://cdn.kernvalley.us/fonts/roboto.woff2',
		/* Other */
	].map(path => new URL(path, location.origin).href),
	allowed: [
		'https://www.google-analytics.com/analytics.js',
		'https://www.googletagmanager.com/gtag/js',
		'https://i.imgur.com/',
		'https://maps.wikimedia.org/osm-intl/',
		'https://cdn.kernvalley.us/img/',
		/https:\/\/\w+\.githubusercontent\.com\/u\/*/,
		new URL('/img/raster/', location.origin).href,
		/\.(jpg|png|webp|svg|gif)$/,
	],
	allowedFresh: [
		new URL('/paths/', location.origin).href,
		'https://api.openweathermap.org/data/',
		'https://api.github.com/users/',
		/\.(html|css|js|json)$/,
	],
};
