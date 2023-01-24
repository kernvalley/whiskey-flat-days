import { create, on, remove } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { save } from 'https://cdn.kernvalley.us/js/std-js/filesystem.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';
let products = [];

async function getProductsFile({ name = 'products.json', type = 'application/json', signal } = {}) {
	return scheduler.postTask(() => new File([JSON.stringify(products, null, 4)], name, { type }), {
		priority: 'background',
		signal,
	});
}

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

on('#product', 'submit', async event => {
	event.preventDefault();
	const data = new FormData(event.target);
	const product = {
		'@context': data.get('@context'),
		'@type': data.get('@type'),
		'@identifier': crypto.randomUUID(),
		name: data.get('name'),
		description: data.get('description'),
		image: await encodeFile(data.get('image')),
		category: data.getAll('category'),
		offers: [{
			'@type': 'Offer',
			'@identifier': crypto.randomUUID(),
			price: parseFloat(data.get('price')),
			priceCurrency: 'USD',
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

	products.push(product);
	document.getElementById('products').append(create('li', { text: data.get('name') }));
	event.target.reset();
});

on('#download', 'click', async ({ currentTarget }) => {
	try {
		currentTarget.disabled = true;
		if (! Array.isArray(products) || products.length === 0) {
			throw new Error('No products added yet');
		} else {
			const file = await getProductsFile();
			await save(file);
		}
	} catch(err) {
		const { resolve, promise } = getDeferred();
		const dialog = create('dialog', {
			events: {
				close: ({ target }) => {
					target.remove();
					resolve();
				}
			},
			children: [
				create('div', {
					classList: ['status-box', 'alert'],
					text: err.message,
				})
			]
		});

		document.body.append(dialog);
		dialog.showModal();
		setTimeout(() => dialog.close(), 5000);
		await promise;
	} finally {
		currentTarget.disabled = false;
	}
});

on('#clear', 'click', () => remove('#products > li'));

on('#product', 'reset', ({ target }) => {
	target.closest('dialog').close();
	const img = createImage('https://cdn.kernvalley.us/img/raster/missing-image.png',{ referrerPolicy: 'no-referrer', crossorigin: 'anonymous' });
	document.getElementById('img-preview').replaceChildren(img);
});

on('#product-image', 'change', async ({ target }) => {
	if (target.validity.valid && target.files.length === 1) {
		const src = await encodeFile(target.files[0]);
		const img = createImage(src, { crossOrigin: 'anonymous', referrerPolicy: 'no-referrer' });
		document.getElementById('img-preview').replaceChildren(img);
	}
});

on('[data-show-modal]', 'click', ({ currentTarget }) => {
	document.querySelector(currentTarget.dataset.showModal).showModal();
});

on('[data-close]', 'click', ({ currentTarget }) => {
	document.querySelector(currentTarget.dataset.close).close();
});
