import { on, enable } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';
import { between } from 'https://cdn.kernvalley.us/js/std-js/math.js';
// import { debounce } from 'https://cdn.kernvalley.us/js/std-js/utility.js';
import {
	whenLoggedIn, uploadFile, getFileURL, getSellers, createProduct, getCurrentUser,
} from './firebase.js';
import { firebase, Availability } from './consts.js';
import { createOption } from 'https://cdn.kernvalley.us/js/std-js/elements.js';

const invalidAvailabilities = ['Discontinued', 'InStoreOnly'];

async function encodeFile(file, { signal } = {}) {
	const { resolve, reject, promise } = getDeferred();

	if (! (file instanceof File)) {
		reject(new TypeError('Not a file'));
	} else if (signal instanceof AbortSignal && signal.aborted) {
		reject(signal.reason);
	} else {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.addEventListener('load', ({ target: { result }}) => resolve(result), { signal });
		reader.addEventListener('error', reject, { signal });

		if (signal instanceof AbortSignal) {
			signal.addEventListener('abort', ({ target }) => reject(target.reason), { once: true });
		}
	}

	return promise;
}

getSellers().then(sellers => {
	const opts = sellers.map(({ '@identifier': value, name: label }) => createOption({ label, value }));
	document.getElementById('product-seller').append(...opts);
});

document.getElementById('product-availability').append(
	...Object.entries(Availability)
		.map(([value, label]) => createOption({ label, value, disabled: invalidAvailabilities.includes(value) }))
);

scheduler.postTask(async () => {
	await whenLoggedIn();

	on('#product', 'submit', async event => {
		event.preventDefault();
		const data = new FormData(event.target);
		const user = await getCurrentUser();

		if (typeof user === 'object' & ! Object.is(user, null)) {
			const img = data.get('image');
			const name = `/wfd-store/products/${crypto.randomUUID()}`;
			await uploadFile(firebase.bucket, img, { name });
			const sellers = await getSellers();
			const sellerID = data.get('manufacturer');
			const seller = sellers.find(({ '@identifier': id }) => id === sellerID);

			seller.member = [{
				'@type': 'Person',
				'@identifier': user.uid,
				name: user.displayName,
				email: user.email,
			}];

			const product = {
				'@context': data.get('@context'),
				'@type': data.get('@type'),
				'@identifier': crypto.randomUUID(),
				name: data.get('name'),
				description: data.get('description'),
				image: await getFileURL(firebase.bucket, name),
				category: data.getAll('category'),
				manufacturer: seller,
				offers: [{
					'@type': 'Offer',
					'@identifier': crypto.randomUUID(),
					price: parseFloat(data.get('price')),
					priceCurrency: 'USD',
					availability: data.get('availability'),
					seller,
					'shippingDetails': [{
						'@type': 'OfferShippingDetails',
						'@identifier': crypto.randomUUID(),
						shippingRate: {
							'@type': 'MonetaryAmount',
							value: parseFloat(data.get('shipping')),
							currency: 'USD',
						}
					}]
				}]
			};

			await createProduct(product);
			event.target.reset();
		}
	});

	on('#product', 'reset', ({ target }) => {
		target.closest('dialog').close();

		const img = createImage('https://cdn.kernvalley.us/img/raster/missing-image.png',{
			referrerPolicy: 'no-referrer',
			crossorigin: 'anonymous',
		});

		document.getElementById('img-preview').replaceChildren(img);
	});

	on('#product-image', 'change', async ({ target }) => {
		if (target.files.length === 1) {
			try {
				const file = target.files[0];
				console.log({ file });

				if (! ['image/jpeg', 'image/png'].includes(file.type.toLowerCase())) {
					target.setCustomValidity(`Invalid file type: ${file.type}`);
				} else if (file.size > 102400) {
					target.setCustomValidity('File size too large');
				} else if (file.size === 0) {
					target.setCustomValidity('Appears to be an empty file');
				} else {
					const src = await encodeFile(file);
					const img = createImage(src, {
						crossOrigin: 'anonymous',
						referrerPolicy: 'no-referrer',
					});

					document.getElementById('img-preview').replaceChildren(img);

					await img.decode();

					if (! between(400, img.naturalWidth, 640)) {
						target.setCustomValidity(`Image is an invalid width: ${img.naturalWidth}`);
					} else if(! between(400, img.naturalHeight, 480)) {
						target.setCustomValidity(`Image is an invalid height: ${img.naturalHeight}`);
					} else {
						target.setCustomValidity('');
					}
				}
				// @TODO verify image size

			} catch(err) {
				console.error(err);
				target.setCustomValidity('An error occurred processing the image');
			}
		}
	});

	on('[data-show-modal]', 'click', ({ currentTarget }) => {
		document.querySelector(currentTarget.dataset.showModal).showModal();
	});

	on('[data-close]', 'click', ({ currentTarget }) => {
		document.querySelector(currentTarget.dataset.close).close();
	});

	on('[data-hint]', 'click', ({ currentTarget }) => {
		const hint = document.querySelector(currentTarget.dataset.hint);

		if (hint.hidden) {
			hint.hidden = false;
			setTimeout(() => hint.hidden = true, 5000);
		} else {
			hint.hidden = true;
		}
	});

	on('[data-error-message]', 'change', ({ currentTarget }) => {
		setTimeout(() => currentTarget.reportValidity(), 500);
	});

	on('[data-error-message]', 'invalid', ({ currentTarget }) => {
		const hint = document.querySelector(currentTarget.dataset.errorMessage);
		console.log({ hint, currentTarget });

		if (currentTarget.validity.valid) {
			hint.hidden = true;
		} else {
			hint.hidden = false;
			setTimeout(() => hint.hidden = true, 5000);
		}
	});

	enable('#controls button.btn');
});
