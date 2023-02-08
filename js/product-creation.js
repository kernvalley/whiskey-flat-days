import { on, enable, animate, css, text } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { createImage, createElement } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { fileToCanvas, canvasToFile } from 'https://cdn.kernvalley.us/js/std-js/img-utils.js';
import { isObject } from 'https://cdn.kernvalley.us/js/std-js/utility.js';
import { showDialog } from 'https://cdn.kernvalley.us/js/std-js/error-handler.js';
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
	document.documentElement.classList.add('logged-in');

	on('#store-builder', 'submit', async event => {
		event.preventDefault();
		const data = new FormData(event.target);
		const user = await getCurrentUser();
		if (! isObject(user)) {
			throw new DOMException('You must be logged in for that');
		}

		const dialog = createElement('dialog', {
			events: {
				close: ({ target }) => target.remove(),
				click: ({ currentTarget }) => currentTarget.close(),
			},
			children:[
				createElement('pre', {
					children: [
						createElement('code', {
							text: JSON.stringify({
								'@context': data.get('@context'),
								'@type': data.get('@type'),
								'@identifier': crypto.randomUUID(),
								name: data.get('name'),
								description: data.get('description'),
								logo: data.get('logo').name,
								email: data.get('email'),
								telephone: data.get('telephone'),
								url: data.get('url'),
								sameAs: data.getAll('sameAs'),
								employee: [user.uid],
							}, null, 4)
						})
					]
				})
			]
		});

		document.body.append(dialog);
		dialog.showModal();
	});

	Promise.allSettled(animate('a.btn.login, a.btn.register', [
		{ transform: 'none', opacity: 1 },
		{ transform: 'scale(0)', opacity: 0 },
	], {
		duration: 800,
		easing: 'ease-in',
		fill: 'forwards',
	}).map(anim  => anim.finshed));

	Promise.allSettled(animate('.show-create-dialog', [
		{ transform: 'none' },
		{ transform: 'rotate(-5deg)' },
		{ transform: 'rotate(0)' },
		{ transform: 'rotate(5deg)' },
		{ transform: 'rotate(0)' }
	], {
		duration: 300,
		delay: 0,
		iterations: 3,
		easing: 'ease-in-out',
	}).map(anim => anim.finished)).then(() => {
		animate('.show-create-dialog', [
			{ transform: 'none' },
			{ transform: 'scale(1.5) translateY(-3em)' },
		], {
			duration: 300,
			fill: 'forwards',
			easing: 'ease-in',
		});
	});

	on('#product', 'submit', async event => {
		event.preventDefault();
		const data = new FormData(event.target);
		const user = await getCurrentUser();

		if (isObject(user)) {
			try {
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
			} catch(err) {
				showDialog(err, { signal: AbortSignal.timeout(5000), level: 'warn' });
			}
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

	enable('.show-create-dialog');
	css('a.login, a.register', { 'pointer-events': 'none', 'text-decoration': 'none' });
	text('#msg > .status-box', 'Click on the "+ Add Item" button to continue. After creating one item, click it again to create additional items.');
}).catch(err => {
	showDialog(err, { signal: AbortSignal.timeout(5000), level: 'warn' });
});
