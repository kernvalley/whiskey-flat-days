import { createCustomElement } from '@shgysk8zer0/kazoo/custom-elements.js';
import { getJSON, navigateTo } from '@shgysk8zer0/kazoo/http.js';
import { isObject } from '@shgysk8zer0/kazoo/utility.js';
import { find } from '@shgysk8zer0/kazoo/dom.js';
import { site, icons, mapSelector, startDate, endDate } from './consts.js';
import { createElement } from '@shgysk8zer0/kazoo/elements.js';
import { createGoogleCalendar } from '@shgysk8zer0/kazoo/google/calendar.js';
import { createXIcon } from '@shgysk8zer0/kazoo/icons.js';
import { clamp } from '@shgysk8zer0/kazoo/math.js';

const allowedOrigins = [];

export function findNextEvent({ base = document.body, type = 'Event' } = {}) {
	const now = new Date();
	const timeEl = find(
		`[itemtype="https://schema.org/${type}"] [itemprop="startDate"]`,
		({ dateTime }) => new Date(dateTime) > now,
		{ base },
	);

	if (timeEl instanceof Element) {
		return timeEl.closest('[itemtype="https://schema.org/Event"]');
	}
}

export const getPages = (async () => {
	const pages = await getJSON('/pages.json');
	return Object.fromEntries(
		Object.entries(pages)
			.map(([name, { url, ...rest }]) => [name, { url: new URL(url, document.baseURI), ...rest }])
	);
}).once();

function isPage(thing) {
	return isObject(thing) && thing.url instanceof URL;
}

export async function redirect(to, { redirect: redirectPath, utm, params = {}} = {}) {
	if (isPage(to)) {
		redirect(to.url, { redirect: redirectPath, utm, params });
	} else if (typeof to === 'string') {
		redirect(new URL(to, document.baseURI), { redirect: redirectPath, utm, params });
	} else if (to instanceof URL) {
		navigateTo(to, { params: { redirect: redirectPath, ...params }, utm, allowedOrigins });
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
	if (url.pathname.startsWith('/map') && url.search !== '') {
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

export async function showGoogleCalendarModal(calendarId, { showTabs = true } = {}) {
	const { resolve, promise } = Promise.withResolvers();
	const dialog = createElement('dialog', {
		classList: ['no-border', 'background-none'],
		events: {
			close: ({ target }) => {
				target.remove();
				resolve();
			},
		},
		styles: {
			border: 'none',
			background: 'transparent',
		},
		animation: {
			keyframes: [
				{ opacity: 0 },
				{ opacity: 1 },
			],
			duration: 400,
			easing: 'ease-out',
			fill: 'both',
		},
		children: [
			createElement('div', {
				classList: ['clearfix'],
				children: [
					createElement('button', {
						type: 'button',
						title: 'Close',
						classList: ['no-border', 'background-none', 'float-right'],
						events: {
							click: ({ target }) => target.closest('dialog').close(),
						},
						children: [createXIcon({ size: 24, fill: '#fafafa' })]
					}),
				]
			}),
			document.createElement('br'),
			createGoogleCalendar(calendarId, {
				showTabs,
				showPrint: innerWidth > 800,
				width: clamp(400, parseInt(innerWidth * 0.8), 600),
				height: parseInt(innerHeight * 0.8),
			}),
		]
	});

	document.body.append(dialog);
	dialog.showModal();
	return promise;
}
