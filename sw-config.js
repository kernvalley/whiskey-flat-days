---
layout: null
---
/* eslint-env serviceworker */
/* eslint no-unused-vars: 0*/
'use strict';

async function updateAssets(assets, {
	referrerPolicy = 'no-referrer',
	version = '{{ site.data.app.version | default: site.version }}',
} = {}) {
	if (Array.isArray(assets) && assets.length !== 0) {
		const cache = await caches.open(version);
		await Promise.allSettled(assets.filter(url => url.length !== 0).map(async url => {
			const req = new Request(new URL(url, location.origin), { referrerPolicy: 'no-referrer' });
			const resp = await fetch(req);

			if (resp.ok) {
				await cache.put(req, resp);
			}
		}));
	}
}

const config = {
	version: '{{ site.data.app.version | default: site.version }}',
	fresh: [
		'{{ site.pages | where: "pinned", true | map: "url" | join: "', '" }}',
		'/webapp.webmanifest',
		'https://apps.kernvalley.us/apps.json',
		'https://cdn.kernvalley.us/img/markers.svg',
		/* Other */
		'/store/products.json',
	].map(path => new URL(path, location.origin).href),
	stale: [
		/* Scripts */
		'/js/index.min.js',
		'https://unpkg.com/@shgysk8zer0/polyfills@0.0.6/all.min.js',
		'https://unpkg.com/@shgysk8zer0/kazoo@0.0.12/harden.js',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/leaflet/map.min.js',

		/* Custom Element Templates */
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/toast-message.html',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/pwa/prompt.html',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/leaflet/map.html',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/weather/current.html',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/install/prompt.html',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/share-to-button/share-to-button.html',

		/* CSS */
		'/css/index.min.css',
		'/css/store.css',
		'https://unpkg.com/leaflet@1.8.0/dist/leaflet.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/toast-message.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/pwa/prompt.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/leaflet/map.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/weather/current.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/install/prompt.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/share-to-button/share-to-button.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/window-controls.css',
		'https://unpkg.com/@shgysk8zer0/components@0.0.5/stripe/payment-form.css',

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
		'https://cdn.kernvalley.us/fonts/rye.woff2',
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
	periodicSync: {
		'main-assets': async () => await updateAssets([
			'/js/index.min.js',
			'/css/index.min.css',
			'/img/icons.svg',
			'/webapp.webmanifest',
		]),
		'pinned-pages': async () => await updateAssets([
			'{{ site.pages | where: "pinned", true | map: "url" | join: "', '" }}'
		]),
		'recent-posts': async () => await updateAssets(['{{ site.posts | map: "url" | join: "', '" }}']),
	}
};
