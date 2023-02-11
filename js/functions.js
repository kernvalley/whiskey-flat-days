import { createCustomElement } from 'https://cdn.kernvalley.us/js/std-js/custom-elements.js';
import { navigateTo } from 'https://cdn.kernvalley.us/js/std-js/http.js';
import { isObject } from 'https://cdn.kernvalley.us/js/std-js/utility.js';
import { site, icons, mapSelector, startDate, endDate } from './consts.js';
import { PAGES } from './pages.js';
const allowedOrigins = [];

function isPage(thing) {
	return isObject(thing) && thing.url instanceof URL;
}

export function redirect(page, { params, utm } = {}) {
	if (isPage(page)) {
		navigateTo(page.url, { params, utm, allowedOrigins });
	} else if (typeof page === 'string') {
		navigateTo(new URL(page, location.origin), { params, utm, allowedOrigins });
	} else if (page instanceof URL) {
		navigateTo(page, { params, utm, allowedOrigins });
	}
}

export function resetApp({
	redirect: redirectPath = PAGES.home.url.pathname,
} = {}) {
	if (isPage(redirectPath)) {
		redirect(PAGES.reset, { params: { redirect: redirectPath.url.pathname }});
	} else if (redirectPath instanceof URL && redirectPath.origin === location.origin) {
		redirect(PAGES.reset, { params: { redirect: redirectPath.pathname }});
	} else  if (typeof redirectPath === 'string' && redirectPath.startsWith('/')){
		redirect(PAGES.reset, { params: { redirect: redirectPath }});
	} else if (typeof redirectPath === 'undefined' || Object.is(redirectPath, null)) {
		redirect(PAGES.reset);
	} else {
		throw new Error('Invalid redirect for PWA reset');
	}
}

export function intersectCallback({ target, isIntersecting }) {
	if (isIntersecting) {
		target.animate([{
			transform: 'rotateX(-30deg) scale(0.85) translateY(3em)',
			opacity: 0.3,
		}, {
			transform: 'none',
			opacity: 1,
		}], {
			duration: 300,
			easing: 'ease-in-out',
		});

		target.classList.remove('hidden');
	} else {
		target.classList.add('hidden');
	}
}

export function filterEventNamesDatalist() {
	const datalist = document.getElementById('events-list');

	if (datalist instanceof HTMLElement) {
		const opts = new Set();

		[...datalist.options].forEach(opt => {
			opts.add(opt.value);
			opt.remove();
		});

		opts.forEach(opt => {
			const el = document.createElement('option');
			el.value = opt;
			datalist.append(el);
		});
	}
}

export function isOnGoing() {
	const now = new Date();
	return (now > startDate && now < endDate);
}

export async function searchLocationMarker(url = new URL(location.href)) {
	if (! (url instanceof URL)) {
		url = new URL(url);
	}
	if (url.pathname.startsWith(PAGES.map.url.href) && url.search !== '') {
		if (! url.searchParams.has('coords')) {
			return false;
		} else if (url.searchParams.get('coords').startsWith('geo:')) {
			const [latitude = null, longitude = null] = url.searchParams.get('coords').replace('geo:', '').split(',', 2).map(parseFloat);
			const loc = new URL(location.pathname, location.origin);
			location.hash = `#${latitude},${longitude}`;
			history.replaceState({
				latitude,
				longitude,
				title: `${url.searchParams.get('title') || 'Location'}`,
				body: `Location: ${latitude}, ${longitude}`,
			}, `${url.searchParams.get('title') || 'Location'} | ${site.title}`, loc.href);
		} else if (url.searchParams.get('coords').startsWith('https://')) {
			// On Android, URL & text are shared in same field
			return new URL(url.searchParams.get('coords').split(' ', 1)[0]);
		}
	}

	return false;
}

export async function createMarker({
	latitude = NaN,
	longitude = NaN,
	title = null,
	body = null,
	icon = icons.markLocation,
	iconSize = 32,
	uuid = null,
	id = null,
} = {}) {
	const marker = await createCustomElement('leaflet-marker');
	marker.latitude = latitude;
	marker.longitude = longitude;
	const map = await getMap();
	const hash = typeof uuid === 'string' ? uuid : `${latitude},${longitude}`;

	if (typeof uuid === 'string') {
		marker.id = uuid;
	} else if (typeof id === 'string') {
		marker.id = id;
	}

	marker.append(getIcon(icon, {size: iconSize}));
	marker.title = title;

	if (typeof body === 'string' && typeof title === 'string') {
		const popup = document.createElement('div');
		const h4 = document.createElement('h4');
		const content = document.createElement('div');
		const share = await getShareButton({hash, text: title, part: ['share']});

		popup.slot = 'popup';
		h4.textContent = title;
		content.textContent = body;
		popup.append(h4, content, document.createElement('hr'), share);
		marker.append(icon, popup);
		map.append(marker);
	} else if (body instanceof HTMLElement) {
		const share = await getShareButton({hash, text: title, part: ['share']});
		body.slot = 'popup';
		body.append(document.createElement('hr', share));
		marker.append(icon, body);
		map.append(marker);
	} else {
		marker.append(icon);
		map.append(marker);
	}

	return marker;
}

export function getIcon(src = icons.markLocation, {
	size = 32,
	alt = 'icon',
	role = 'presentation',
	loading = 'lazy',
	decoding = 'async',
	crossOrigin = 'anonymous',
	referrerPolicy = 'no-referrer',
	slot = 'icon',
	part = 'icon',
}) {
	const icon = new Image(size, size);
	icon.alt = alt;
	icon.role = role;
	icon.loading = loading;
	icon.decoding = decoding;
	icon.crossOrigin = crossOrigin;
	icon.referrerPolicy = referrerPolicy;
	icon.slot = slot;
	icon.src = new URL(src, site.markerIconBaseUri).href;

	if ('part' in icon && icon.part.add instanceof Function) {
		icon.part.add(part);
	}

	return icon;
}

export async function componentsDefined(...tags) {
	await Promise.all(tags.map(customElements.whenDefined));
}

export async function getMap() {
	await customElements.whenDefined('leaflet-map');
	const map = document.querySelector(mapSelector);

	if (map instanceof HTMLElement) {
		await map.ready;
		return map;
	} else {
		return null;
	}
}

export async function getShareButton({
	hash = null,
	textContent = 'Share',
	text = null,
	slot = null,
	part = [],
} = {}) {
	const share = await createCustomElement('share-button');
	const url = new URL(location.pathname, location.origin);

	if (typeof hash === 'string') {
		url.hash = `#${hash.replace('#', '')}`;
	}

	if (typeof text === 'string') {
		share.text = text;
	}

	if (typeof slot === 'string') {
		share.slot = slot;
	}

	if (part.length !== 0 && 'part' in share && share.part.add instanceof Function) {
		share.part.add(...part);
	}

	share.url = url;
	share.hidden = ! (navigator.share instanceof Function);
	share.textContent = textContent;

	return share;
}
