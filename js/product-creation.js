import { on, enable } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';
// import { debounce } from 'https://cdn.kernvalley.us/js/std-js/utility.js';
import { whenLoggedIn, uploadFile, getFileURL, getSellers, createProduct } from './firebase.js';
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
		const img = data.get('image');
		const name = `/wfd-store/products/${crypto.randomUUID()}`;
		await uploadFile(firebase.bucket, img, { name });
		const sellers = await getSellers();
		const sellerID = data.get('manufacturer');
		const seller = sellers.find(({ '@identifier': id }) => id === sellerID);

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

		const result = await createProduct(product);
		console.log({ result });
		event.target.reset();
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
		if (target.validity.valid && target.files.length === 1) {
			const src = await encodeFile(target.files[0]);
			const img = createImage(src, {
				crossOrigin: 'anonymous',
				referrerPolicy: 'no-referrer',
			});

			document.getElementById('img-preview').replaceChildren(img);
			await img.decode();
			// @TODO verify image size
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
		if (! currentTarget.validity.valid) {
			const hint = document.querySelector(currentTarget.dataset.errorMessage);
			hint.hidden = false;
			setTimeout(() => hint.hidden = true, 5000);
		}
	});

	on('[data-error-message]', 'invalid', ({ currentTarget }) => {
		const hint = document.querySelector(currentTarget.dataset.errorMessage);
		hint.hidden = false;
		setTimeout(() => hint.hidden = true, 5000);
	});

	enable('#controls button.btn');
});
