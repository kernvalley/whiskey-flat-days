import { HTMLStripePaymentFormElement } from 'https://cdn.kernvalley.us/components/stripe/payment-form.js';
import { on, create, value, text, attr, data, disable } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { getStripeKey, getSecret } from './stripe.js';
import { getJSON } from 'https://cdn.kernvalley.us/js/std-js/http.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { Cart } from './Cart.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';

const currency = 'USD';
const taxRate = 0.0725;
const getProducts = (() => getJSON('/store/products.json')).once();

async function calculateCardFee(req) {
	return toCurrency(getTotal(req) * 0.03 + 0.35);
}

async function calculateTaxes(req) {
	return toCurrency(getTotal(req) * taxRate);
}

async function calculateShipping() {
	return 0;
}

async function loadStoreItems({ signal } = {}) {
	const params = new URLSearchParams(location.search);
	const tmp = document.getElementById('item-preview-template').content;
	const products = params.has('seller')
		? await getSellerProducts(params.get('seller'),{ signal })
		: await getProducts();

	document.getElementById('product-list').append(...products.map(product => {
		console.log(product);
		const base = tmp.cloneNode(true).querySelector('.product-listing');
		const sellerURL = new URL(location.pathname, location.origin);
		const itemtype = new URL(product['@type' || 'Product'], base['@context'] || 'https://schema.org');

		sellerURL.searchParams.set('seller', product.manufacturer['@identifier']);
		base.id = product['@identifier'];
		attr(base, { itemtype });
		text('.product-name[itemprop="name"]', product.name, { base });
		text('[itemprop="description"]', product.description, { base });
		attr('[itemprop="image"]', { src: product.image }, { base });
		text('.product-seller [itemprop="name"]', product.manufacturer.name, { base });
		attr('.product-seller [itemprop="url"]', { href: sellerURL }, { base });
		text('[itemprop="price"]', product.offers[0].price, { base });

		on(base, 'click', async ({ target, currentTarget }) => {
			if (! (target.closest('img, a, button') instanceof HTMLElement)) {
				console.log({ target, currentTarget });
				event.preventDefault();
				await showProductDetails(currentTarget.id);
			}
		});

		return base;
	}));
}

async function getProductDetails(id, { signal } = {}) {
	const url = new URL('/api/products', document.baseURI);
	url.searchParams.set('id', id);
	return getJSON(url, { signal });
}

async function getSellerProducts(seller, { signal } = {}) {
	const url = new URL('/api/products', document.baseURI);
	url.searchParams.set('seller', seller);
	return getJSON(url, { signal });
}

async function showProductDetails(id, { signal } = {}) {
	const cart = new Cart();
	const previous = location.href;
	const [product, { quantity = 1 } = {}] = await Promise.all([
		getProductDetails(id, { signal }),
		cart.get(id, { signal }),
	]);

	const { resolve, promise } = getDeferred();
	const tmp = document.getElementById('item-details-template').content.cloneNode(true);
	const shareURL = new URL(location.href);
	shareURL.hash = `#${id}`;
	text('[itemprop="name"]', product.name, { base: tmp });
	text('[itemprop="description"]', product.description, { base: tmp });
	on(tmp.querySelector('form'), 'submit', async event => {
		event.preventDefault();
		try {
			const data = new FormData(event.target);
			await cart.add({
				id: data.get('id'),
				quantity: parseInt(data.get('quantity')),
				offer: data.get('offer'),
			});

			event.target.closest('dialog').close();
		} catch(err) {
			console.error(err);
		}
	});

	value('[name="id"]', id, { base: tmp });
	value('[name="quantity"]', quantity, { base: tmp });

	attr('[itemprop="image"]',{
		src: product.image,
	}, { base: tmp });

	on(tmp.querySelectorAll('.close-btn'), 'click', ({ target }) => {
		target.closest('dialog').close();
	});

	if (navigator.share instanceof Function) {
		data('[data-title][data-url]', {
			title: product.name,
			url: shareURL,
			text: product.description,
		}, { base: tmp });

		on(tmp.querySelector('[data-title][data-url]'), 'click', ({ currentTarget }) => {
			const { title, url, text } = currentTarget.dataset;
			navigator.share({ title, url, text });
		}, { base: tmp });
	} else {
		disable('[data-title][data-url]', { base: tmp });
	}

	tmp.querySelector('select[name="offer"]').append(
		...product.offers.map(({ '@identifier': value, name = 'Offering', price, availability = 'InStock' }) => create('option', {
			value, text: `${name} [$${price}]`, disabled: availability !== 'InStock',
		}))
	);

	const dialog = create('dialog', {
		events: { close: ({ target }) => {
			target.remove();
			history.replaceState(history.state, document.title, previous);
			resolve();
		}},
		children: [...tmp.children],
	});

	document.body.append(dialog);
	history.replaceState(history.state, document.title, shareURL.href);
	dialog.showModal();
	await promise;
}

async function getCart({ signal } = {}) {
	const cart = new Cart();
	const url = new URL('/api/paymentRequest', document.baseURI);
	url.searchParams.set('query', await cart.getQueryString({ signal }));
	return await getJSON(url, { signal });
}

function toCurrency(num) {
	return parseFloat(num.toFixed(2));
}

function getTotal({ displayItems = [], modifiers: { additionalDisplayItems = [] } = {}}) {
	const total = [...displayItems, ...additionalDisplayItems]
		.reduce((total, { amount: { value = 0 } = {}}) => total + value, 0);

	return toCurrency(total);
}

if (location.pathname.startsWith('/store/checkout')) {
	const params = new URLSearchParams(location.search);

	if (params.has('payment_intent_client_secret') && params.has('redirect_status')) {
		//@TODO verify payment_intent_client_secret
		switch(params.get('redirect_status')) {
			case 'succeeded': {
				const dialog = create('dialog', {
					children:[
						create('h2', { text: 'Payment Successful' }),
						create('p', { text: 'Continue to home page.' }),
						create('div', {
							classList: ['center'],
							children: [
								create('a', {
									href: '/',
									role: 'button',
									classList: ['btn', 'btn-primary'],
									text: 'Continue',
								})
							]
						})
					]
				});

				document.body.append(dialog);
				dialog.showModal();
				break;
			}
		}
	} else {
		Promise.all([
			getCart(),
			getStripeKey(),
		]).then(async ([displayItems, key]) => {
			const req = {
				details: {
					displayItems,
					modifiers: {
						additionalDisplayItems: [{
							label: 'Taxes',
							amount: {
								value: await calculateTaxes({ displayItems }),
								currency,
							}
						}, {
							label: 'Shipping',
							amount: {
								value: await calculateShipping({ displayItems }),
								currency,
							},
						}]
					}
				},
				options: {
					requestShipping: true,
				},
				config: {
					layout: 'accordion',
				}
			};

			req.details.modifiers.additionalDisplayItems.push({
				label: 'Processing Fee',
				amount: {
					value: await calculateCardFee(req),
					currency,
				}
			});

			const clientSecret = await getSecret(req.details);
			const form = new HTMLStripePaymentFormElement(key, clientSecret, req);
			form.append(
				create('header', {
					slot: 'header',
					classList: ['center'],
					children: [
						createImage('/img/favicon.svg', {
							height: 96,
							width: 96,
							styles: { border: '1px solid currentColor', 'border-radius': '50%', padding: '0.3em' },
						}),
						create('h2', {
							text: 'WhiskeyFlatDays.com Store Checkout',
						}),
						document.createElement('br'),
					]
				}),
				create('footer', {
					slot: 'footer',
					classList: ['card', 'flex', 'row', 'space-evenly'],
					children: [
						create('a', {
							role: 'button',
							classList: ['btn', 'btn-primary'],
							href: '/store/cart',
							text: 'Back to Cart',
						}),
						create('a', {
							role: 'button',
							classList: ['btn', 'btn-primary'],
							href: '/store/',
							text: 'Back to Store',
						}),
					]
				}),
			);
			document.getElementById('main').append(form);
		});
	}
} else if (location.pathname.startsWith('/store/cart')) {
	const cart = new Cart();
	Promise.all([
		getProducts(),
		cart.getAll(),
	]).then(([products, items]) => {
		document.getElementById('cart-container').append(...items.map(({ id, quantity, offer }) => {
			const product = products.find(({ '@identifier': identifier }) => id === identifier);

			if (typeof product === 'object') {
				const price = typeof offer === 'string'
					? product.offers
						.find(({ '@identifier': id }) => id === offer).price
					: product.offers[0].price;
				return create('div', {
					classList: ['card', 'shadow', 'cart-item-listing'],
					dataset: { id, offer, quantity, price },
					children: [
						create('h3', { text: product.name }),
						create('div', {
							children: [
								create('b', { text: 'Price: ' }),
								create('span', { text: '$' + price.toFixed(2) })
							]
						}),
						create('div', {
							children: [
								create('b', { text: 'Quantity: ' }),
								create('span', { text: quantity.toString() })
							]
						}),
						create('div', {
							children: [
								create('b', { text: 'Total: ' }),
								create('span', { text: '$' + (price * quantity).toFixed(2) })
							]
						}),
						create('div', {
							classList: ['flex', 'row', 'cart-btns', 'space-evenly'],
							children: [
								create('button', {
									classList: ['btn', 'btn-reject'],
									dataset: { id },
									text: 'Remove',
									events: {
										click: async ({ currentTarget }) => {
											await cart.remove(currentTarget.dataset.id);
											currentTarget.closest('.cart-item-listing').remove();
										}
									}
								})
							]
						}),
					]
				});
			} else {
				return '';
			}
		}));
	});
} else if(location.pathname === '/store/') {
	loadStoreItems().then(() => {
		on('.product-listing .product-img', 'click', ({ target }) => {
			const dialog = create('dialog', {
				events: { close: ({ target }) => target.remove() },
				children: [
					create('div', {
						classList: ['center'],
						children: [target.cloneNode()],
					}),
					create('div', {
						classList: ['center'],
						children: [
							create('button', {
								classList: ['btn', 'btn-reject'],
								text: 'Close',
								events: { click: ({ target }) => target.closest('dialog').close() },
							}),
						]
					})
				],
			});

			document.body.append(dialog);
			dialog.showModal();
		});

		if (location.hash.length === 37) {
			showProductDetails(location.hash.substr(1));
		}
	});
}
