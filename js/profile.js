import { on, ready, loaded } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { resizeImageFile } from 'https://cdn.kernvalley.us/js/std-js/img-utils.js';
import { isObject } from 'https://cdn.kernvalley.us/js/std-js/utility.js';
import { createSeller, uploadFile, getFileURL, getCurrentUser, whenLoggedIn, getLoggedInSeller } from './firebase.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { firebase } from './consts.js';
import { redirect } from './functions.js';

const MISSING_IMAGE = 'https://cdn.kernvalley.us/img/raster/missing-image.png';

const url = new URL(location.href);

if (url.pathname === '/store/profile') {
	const controller = new AbortController();

	loaded().then(() => {
		scheduler.postTask(() => {
			const url = new URL('/account/login', location.origin);
			url.searchParams.set('redirect', location.pathname);
			redirect(url);
		}, {
			delay: 8000,
			priority: 'background',
			signal: controller.signal,
		});
	});

	whenLoggedIn().then(async () => {
		controller.abort();
		const user = await getCurrentUser();
		const found = await getLoggedInSeller().catch(console.error);

		if (isObject(found)) {
			Object.entries(found).forEach(([name, value]) => {
				if (name === 'sameAs' && Array.isArray(value)) {
					value.forEach(social => {
						const url = new URL(social);
						const input = document.querySelector(`input[name="sameAs"][data-origin="${url.origin}"]`);

						if (input instanceof HTMLInputElement) {
							input.value = url.href;
						}
					});
				} else if (name === 'image' && typeof value === 'string' && value.length !== 0) {
					document.getElementById('img-preview').replaceChildren(createImage(found.image, {
						crossOrigin: 'anonymous',
						referrerPolicy: 'no-referrer',
						loading: 'lazy',
						alt: `${found.name} logo`,
						styles: { 'max-width': '100%', height: 'auto' },
					}));
				} else if (! ['@context'].includes(name)) {
					const input = document.querySelector(`select[name="${name}"], input[name="${name}"]`);

					if (input instanceof HTMLElement) {
						input.value = value;
					}
				}
			});
		}

		on('#vendor-profile', 'submit', async event => {
			event.preventDefault();
			const data = new FormData(event.target);
			const userSeller = await getLoggedInSeller();

			const image = await (async file => {
				if (file instanceof File && file.type.startsWith('image/')) {
					const logo = await resizeImageFile(file, { type: 'image/png', height: 480 });
					const fname = `/wfd-store/vendors/${data.get('@identifier')}.png`;
					await uploadFile(firebase.bucket, logo, { name: fname });
					return await getFileURL(firebase.bucket, fname);
				} else if ('image' in userSeller) {
					return userSeller.image;
				} else {
					return MISSING_IMAGE;
				}
			})(data.get('image'));

			const seller = {
				'@context': data.get('@context'),
				'@type': data.get('@type'),
				'@identifier': data.get('@identifier'),
				name: data.get('name') || userSeller.name,
				description: data.get('description') || userSeller.description,
				image: image,
				email: data.get('email') || userSeller.email,
				telephone: data.get('telephone'),
				url: data.get('url'),
				sameAs: data.getAll('sameAs').filter(l => typeof l === 'string' && l.length !== 0),
				employee: [user.uid],
			};

			await createSeller(seller, user.uid);

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

			document.getElementById('loading-container').remove();
			document.getElementById('form-container').hidden = false;
		});
	});
}
