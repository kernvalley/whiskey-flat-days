---
layout: null
---
'use strict';
/*eslint no-unused-vars: 0*/
const config = {
	version: '{{ site.data.app.version | default: site.version }}',
	fresh: [
		/* Root document */
		'{{ site.pages | where: "pinned", true | map: "url" | join: "', '" }}',
		'{{ site.events | where: "pinned", true | map: "url" | join: "', '" }}',
	].map(path => new URL(path, location.origin).href),
	stale: [
		/* Other HTML */
		'/css/index.min.css',
		'/js/index.min.js',
		'/img/icons.svg',
		'https://cdn.polyfill.io/v3/polyfill.min.js',
		'https://cdn.kernvalley.us/components/toast-message.html',
		'https://cdn.kernvalley.us/components/share-to-button/share-to-button.html',
		'https://cdn.kernvalley.us/components/leaflet/map.html',
		'https://cdn.kernvalley.us/components/pwa/prompt.html',
		'https://cdn.kernvalley.us/components/weather-current.html',
		'https://cdn.kernvalley.us/components/github/user.js',

		/* JS, `customElements`, etc. */

		/* CSS */
		'https://unpkg.com/leaflet@1.6.0/dist/leaflet.css',

		/* Images & Icons */
		'/img/apple-touch-icon.png',
		'/img/icon-192.png',
		'/img/favicon.svg',
		'https://cdn.kernvalley.us/img/adwaita-icons/actions/mail-send.svg',
		'https://cdn.kernvalley.us/img/adwaita-icons/actions/mark-location.svg',
		'https://cdn.kernvalley.us/img/octicons/file-media.svg',

		/* Social Icons for Web Share API shim */
		'https://cdn.kernvalley.us/img/octicons/mail.svg',
		'https://cdn.kernvalley.us/img/logos/facebook.svg',
		'https://cdn.kernvalley.us/img/logos/twitter.svg',
		'https://cdn.kernvalley.us/img/logos/google-plus.svg',
		'https://cdn.kernvalley.us/img/logos/linkedin.svg',
		'https://cdn.kernvalley.us/img/logos/reddit.svg',
		'https://cdn.kernvalley.us/img/logos/gmail.svg',
		'https://cdn.kernvalley.us/img/logos/instagram.svg',

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
		/https:\/\/events\.kernvalley\.us\/events\/*/,
		/https:\/\/api\.github\.com\/users/,
		/https:\/\/*\.githubusercontent\.com\/u/,
	],
};
