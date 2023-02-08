import { on, enable } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { fileToCanvas, canvasToFile } from 'https://cdn.kernvalley.us/js/std-js/img-utils.js';
// import { debounce } from 'https://cdn.kernvalley.us/js/std-js/utility.js';
import {
	whenLoggedIn, uploadFile, getFileURL, getSellers, createProduct, getCurrentUser,
} from './firebase.js';
import { firebase, Availability } from './consts.js';
import { createOption } from 'https://cdn.kernvalley.us/js/std-js/elements.js';

const invalidAvailabilities = ['Discontinued', 'InStoreOnly'];

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
			const canvas = document.getElementById('preview-canvas');
			const img = await canvasToFile(canvas, { name: crypto.randomUUID() });
			const name = `/wfd-store/products/${img.name}`;
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

		const canvas = document.getElementById('preview-canvas');

		if (canvas instanceof HTMLCanvasElement) {
			URL.revokeObjectURL(canvas.dataset.blob);
		}

		document.getElementById('img-preview').replaceChildren(img);
	});

	on('#product-image', 'change', async ({ target }) => {
		if (target.files.length === 1) {
			try {
				const file = target.files[0];
				const canvas = await fileToCanvas(file, { height: 480 });
				const container = document.getElementById('img-preview');
				const current = container.querySelector('canvas');
				canvas.id = 'preview-canvas';

				if (current instanceof HTMLCanvasElement) {
					URL.revokeObjectURL(current.dataset.blob);
					current.replaceWith(canvas);
				} else {
					container.replaceChildren(canvas);
				}
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
