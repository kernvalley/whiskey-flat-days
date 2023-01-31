import { create, on, remove, enable } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { save } from 'https://cdn.kernvalley.us/js/std-js/filesystem.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';
import { confirm } from 'https://cdn.kernvalley.us/js/std-js/asyncDialog.js';
import { whenLoggedIn, createProduct, uploadFile, getFileURL} from './firebase.js';
import { firebase } from './consts.js';

let products = [];

async function getProductsFile({
	name = 'products.json',
	type = 'application/json',
	signal,
} = {}) {
	return scheduler.postTask(
		() => new File([JSON.stringify(products, null, 4)], name, { type }), {
			priority: 'background',
			signal,
		}
	);
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
	const img = data.get('image');
	const name = `/wfd-store/products/${crypto.randomUUID()}`;
	await uploadFile(firebase.bucket, img, { name });

	const product = {
		'@context': data.get('@context'),
		'@type': data.get('@type'),
		'@identifier': crypto.randomUUID(),
		name: data.get('name'),
		description: data.get('description'),
		image: await getFileURL(firebase.bucket, name),
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

	const result = await createProduct(product);
	console.log({ result });

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

			if (await confirm('Clear all saved products on page?')) {
				remove('#products > li');
				products = [];
			}
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

on('#clear', 'click', async () => {
	if (await confirm('Clear all saved products?')) {
		remove('#products > li');
		products = [];
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

scheduler.postTask(async () => {
	const user = await whenLoggedIn();
	console.log(user);
	enable('#controls button.btn');

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
});
