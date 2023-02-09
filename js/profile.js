import { on, ready } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { resizeImageFile } from 'https://cdn.kernvalley.us/js/std-js/img-utils.js';
import { createSeller, uploadFile, getFileURL } from './firebase.js';
import { firebase } from './consts.js';
import { redirect } from './functions.js';

const url = new URL(location.href);

/**
 * @TODO Check login status & get user
 * @TODO Look for stores associated with current user & prefill form
 * @TODO Do not show form to non-logged-in users, redirect to login
 */

on('#vendor-profile', 'submit', async event => {
	event.preventDefault();
	const data = new FormData(event.target);
	const logo = await resizeImageFile(data.get('image'), { type: 'image/png', height: 480 });
	const fname = `/wfd-store/vendors/${data.get('@identifier')}.png`;
	await uploadFile(firebase.bucket, logo, { name: fname });
	const seller = {
		'@context': data.get('@context'),
		'@type': data.get('@type'),
		'@identifier': data.get('@identifier'),
		name: data.get('name'),
		description: data.get('description'),
		image: await getFileURL(firebase.bucket, fname),
		email: data.get('email'),
		telephone: data.get('telephone'),
		url: data.get('url'),
		sameAs: data.getAll('sameAs').filter(l => typeof l === 'string' && l.length !== 0),
	};

	// @TODO this should probably include a reference to the current user
	const result = await createSeller(seller);

	console.log({ seller, result });

	if (url.searchParams.has('redirect')) {
		redirect(url.searchParams.get('redirect'));
	} else {
		redirect('/');
	}
});

on('#vendor-image', 'change', async ({ target: { files }}) => {
	if (files.length === 1 && files[0].type.startsWith('image/')) {
		const file = files[0];
		const img = new Image();
		const container = document.getElementById('img-preview');
		const current = container.querySelector('img');
		img.src = URL.createObjectURL(file);
		await img.decode();
		const { naturalHeight, naturalWidth } = img;
		img.height = 320;
		img.width = naturalWidth * (320 / naturalHeight);

		if (current instanceof HTMLImageElement) {
			if (current.src.startsWith('blob:')) {
				URL.revokeObjectURL(current.src);
			}

			current.replaceWith(img);
		} else {
			container.replaceChildren(img);
		}
	}
});

on('[name="sameAs"][data-origin]', 'change', ({ target }) => {
	try {
		if (target.value.length === 0) {
			target.setCustomValidity('');
		} else if (! target.value.startsWith('https://')) {
			target.value = new URL(target.value, target.dataset.origin).href;
			target.setCustomValidity('');
		} else {
			const url = new URL(target.value);
			const expected = new URL(target.dataset.origin);

			if (! url.origin.endsWith(expected.hostname.replace('www.', ''))) {
				target.setCustomValidity('Invalid URL');
			} else if (! url.protocol === 'https:') {
				target.setCustomValidity('Must use HTTPS URL');
			} else if(url.pathname.length < 3) {
				target.setCustomValidity('Missing profile portion of URL');
			} else if (url.origin !== expected.origin) {
				target.value = new URL(url.pathname, expected.origin).href;
				target.setCustomValidity('');
			} else {
				target.setCustomValidity('');
			}
		}
	} catch(err) {
		console.error(err);
		target.setCustomValidity('An error occurred while parsing the URL');
	}
});

ready().then(() => {
	const ident = document.querySelector('[name="@identifier"]');

	if (typeof ident.value !== 'string' || ident.value.length === 0) {
		ident.value = crypto.randomUUID();
	}
});
