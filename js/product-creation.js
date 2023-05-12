import { on, enable, animate, css, text } from 'dom';
import { createImage, createOption } from 'elements';
import { previewImgOnChange, resizeImageFile } from 'img-utils';
import { isObject } from 'utility';
import { showDialog } from 'error-handler';
import {
	uploadFile, getFileURL, createProduct, getCurrentUser, getLoggedInSeller,
} from './firebase.js';
import { redirect } from './functions.js';
import { firebase, Availability } from './consts.js';

const invalidAvailabilities = ['Discontinued', 'InStoreOnly'];

document.getElementById('product-availability').append(
	...Object.entries(Availability)
		.map(([value, label]) => createOption({ label, value, disabled: invalidAvailabilities.includes(value) }))
);

scheduler.postTask(async () => {
	const seller = await getLoggedInSeller();

	if (! isObject(seller)) {
		const url = new URL('/store/profile', location.origin);
		url.searchParams.set('redirect', location.pathname);
		redirect(url);
	}

	document.documentElement.classList.add('logged-in');

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
				const img = await resizeImageFile(data.get('image'), { height: 480, type: 'image/jpeg', quality: 0.8 });
				const name = `/wfd-store/products/${crypto.randomUUID()}.jpg`;
				await uploadFile(firebase.bucket, img, { name });

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

	previewImgOnChange('#product-image', '#img-preview', {
		height: 480,
		classList: ['img-preview'],
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

	scheduler.postTask(() => document.getElementById('add-dialog').showModal(), {
		delay: 2000,
		priority: 'background',
	});
}).catch(err => {
	showDialog(err, { signal: AbortSignal.timeout(5000), level: 'warn' });
});
