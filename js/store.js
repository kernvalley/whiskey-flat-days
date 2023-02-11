import { HTMLStripePaymentFormElement } from 'https://cdn.kernvalley.us/components/stripe/payment-form.js';
import {
	on, create, value, text, attr, data, disable, each, intersect,
} from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { getStripeKey } from './stripe.js';
import { getJSON, postJSON } from 'https://cdn.kernvalley.us/js/std-js/http.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { Cart } from './Cart.js';
import { clamp } from 'https://cdn.kernvalley.us/js/std-js/math.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';
import { useSVG } from 'https://cdn.kernvalley.us/js/std-js/svg.js';
import { Availability } from './consts.js';
import { intersectCallback, redirect } from './functions.js';
import { PAGES } from './pages.js';
// import { getProducts } from './firebase.js';
const allowedAvailabilities = ['InStock', 'OnlineOnly', 'PreOrder', 'PreSale'];

const isAvailable = product => product.offers
	.some(({ availability }) => typeof availability !== 'string' || allowedAvailabilities.includes(availability));

const getAvailability = (product, index = 0) => Availability[product.offers[index].availability] || 'In Stock';
const getPrice = (product, index = 0) => product.offers[index].price.toFixed(2);

const getProducts = (() => getJSON('/store/products.json')).once();

function getItemType({ '@type': type = 'Thing', '@context': context = 'https://schema.org' }) {
	return new URL(type, context).href;
}

function filterCategory(category) {
	return ({ category: categories = [] } = {}) => categories.includes(category);
}

async function loadStoreItems({ signal } = {}) {
	const params = new URLSearchParams(location.search);
	const hasSeller = params.has('seller');
	const tmp = document.getElementById('item-preview-template').content;
	const products = await (hasSeller
		? getSellerProducts(params.get('seller'), { signal })
		: getProducts()
	).then(products => params.has('category')
		? products.filter(filterCategory(params.get('category')))
		: products
	);

	if (Array.isArray(products) && products.length !== 0) {
		document.getElementById('product-list').replaceChildren(...products.map(product => {
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
			text('[itemprop="price"]', getPrice(product), { base });
			text('[itemprop="availability"]', getAvailability(product), { base });
			attr('[itemprop="availability"]', { content: product.offers[0].availability || 'InStock' }, { base });
			data(base, { availability: product.offers[0].availability });

			on(base, 'click', async ({ target, currentTarget }) => {
				if (! (target.closest('a, button, summary') instanceof HTMLElement)) {
					event.preventDefault();
					await showProductDetails(currentTarget.id);
				}
			});

			return base;
		}));
	} else {
		document.getElementById('product-list').replaceChildren(create('div', {
			classList: ['status-box', 'info'],
			text: 'No Products found. Try again later.',
		}));
	}

	if (hasSeller && products.length !== 0) {
		document.getElementById('vendor-profile').append(await getSeller(products[0].manufacturer));
	}
}

async function getSeller(seller) {
	const tmp = document.getElementById('seller-template').content.cloneNode(true);
	const base = tmp.querySelector('.item-details-seller');
	document.title = `${seller.name} | Whiskey Flat Days`;
	base.id = seller['@identifier'];
	attr(base, { itemtype: getItemType(seller) });
	text('[itemprop="name"]', seller.name, { base: tmp });
	document.querySelector('#nav .current-link').classList.remove('current-link', 'no-pointer-events');

	if (typeof seller.description === 'string') {
		text('[itemprop="description"]', seller.description, { base: tmp });
	}

	if (Array.isArray(seller.sameAs)) {
		each(tmp.querySelectorAll('[itemprop="sameAs"]'), el => {
			const link = seller.sameAs.find(url => url.startsWith(el.href));

			if (typeof link === 'string') {
				el.href = link;
			} else {
				el.remove();
			}
		});
	} else {
		each(tmp.querySelectorAll('[itemprop="sameAs"]'), el => el.remove());
	}

	if (typeof seller.url === 'string') {
		const el = tmp.querySelector('[itemprop="url"]');
		el.href = seller.url;
		text('.link-text', new URL(seller.url).hostname, { base: el });
	} else {
		tmp.querySelector('[itemprop="url"]').remove();
	}

	if (typeof seller.image === 'string') {
		attr('.seller-image', { src: seller.image }, { base });
	} else if (typeof seller.image === 'object' && ! Object.is(seller.image, null)) {
		attr('.seller-image', {
			src: seller.image.url,
			width: seller.image.width,
			height: seller.image.height,
		}, { base });
	}

	if (typeof seller.email === 'string') {
		const el = tmp.querySelector('[itemprop="email"]');
		el.href = `mailto:${seller.email}`;
		text('.link-text', seller.email, { base: el });
	} else {
		tmp.querySelector('[itemprop="email"]').remove();
	}

	if (typeof seller.telephone === 'string') {
		const el = tmp.querySelector('[itemprop="telephone"]');
		el.href = `tel:${seller.telephone}`;
		text('.link-text', seller.telephone.replace('+1-',''), { base: el });
	} else {
		tmp.querySelector('[itemprop="telephone"]').remove();
	}

	return tmp;
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
	const [product, { quantity = 1, offer } = {}] = await Promise.all([
		getProductDetails(id, { signal }),
		cart.get(id, { signal }),
	]);

	const { resolve, promise } = getDeferred();
	const seller = product.manufacturer;
	const tmp = document.getElementById('item-details-template').content.cloneNode(true);
	const shareURL = new URL(location.href);
	const sellerLink = new URL(location.pathname, location.origin);
	sellerLink.searchParams.set('seller', seller['@identifier']);

	shareURL.hash = `#${id}`;
	text('.item-details-name[itemprop="name"]', product.name, { base: tmp });
	text('[itemprop="description"]', product.description, { base: tmp });
	text('.seller-name[itemprop="name"]', seller.name, { base: tmp });
	attr('.seller-link', { href: sellerLink }, { base: tmp });
	text('[itemprop="price"]', getPrice(product), { base: tmp });
	data('#item-qty', { id, offer }, { base: tmp });
	on(tmp.querySelector('#item-qty'), 'change', async ({ target }) => {
		const { id, offer } = target.dataset;
		const quantity = target.valueAsNumber;
		console.log({ id, offer, quantity });
		await cart.add({ id, quantity, offer });
	});
	text('[itemprop="availability"]', getAvailability(product), { base: tmp });
	attr('[itemprop="availability"]', { content: product.offers[0].availability }, { base: tmp });
	tmp.querySelector('button[type="submit"]').disabled = ! isAvailable(product);

	if (Array.isArray(seller.sameAs)) {
		each(tmp.querySelectorAll('[itemprop="sameAs"]'), el => {
			const link = seller.sameAs.find(url => url.startsWith(el.href));

			if (typeof link === 'string') {
				el.href = link;
			} else {
				el.remove();
			}
		});
	} else {
		each(tmp.querySelectorAll('[itemprop="sameAs"]'), el => el.remove());
	}

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

			await reviewCart(cart);
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

async function createPaymentRequest(cart = new Cart(), { signal } = {}) {
	const url = new URL('/api/paymentRequest', document.baseURI);
	const body = await cart.getAll({ signal });
	return await postJSON(url, { body, signal });
}

async function getPaymentRequest({ signal } = {}) {
	const params = new URLSearchParams(location.search);

	if (params.has('token')) {
		const url = new URL('/api/paymentRequest', document.baseURI);
		url.searchParams.set('id', params.get('token'));
		return await getJSON(url, { signal });
	}
}

async function reviewCart(cart, { signal } = {}) {
	const [products, items] = await Promise.all([
		getProducts({ signal }),
		cart.getAll({ signal }),
	]);

	const { resolve, promise } = getDeferred({ signal });

	const dialog = create('dialog', {
		events: { close: ({ target }) => {
			target.remove();
			resolve();
		}},
		classList: ['cart-dialog'],
		children: [
			create('div', {
				classList: ['float', 'top', 'clearfix'],
				children: [
					create('button', {
						type: 'button',
						classList: ['btn', 'btn-reject', 'float-right'],
						events: { click: ({ target }) => target.closest('dialog').close() },
						text: 'X',
						title: 'Close',
					})
				]
			}),
			create('section', {
				id: 'cart-container',
				classList: ['grid', 'cart-review'],
				children: items.map(({ id, quantity, offer }) => {
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
								create('h3', { text: product.name, classList: ['cart-item-name'] }),
								createImage(product.image, { loading: 'lazy', classList: ['cart-item-image'] }),
								create('p', { text: product.description, classList: ['cart-item-description'] }),
								create('div', {
									classList: ['cart-item-details', 'flex','row', 'wrap'],
									children: [
										create('div', {
											classList: ['cart-item-price'],
											children: [
												create('b', { text: 'Price: ' }),
												create('span', { text: '$' + price.toFixed(2) })
											]
										}),
										create('label', {
											children: [
												create('b', { text: 'Quantity: ' }),
												create('input', {
													dataset: { id, offer },
													value: quantity,
													type: 'number',
													required: true,
													min: 0,
													max: 5,
													events: {
														change: async ({ target }) => {
															const item = {
																id: target.dataset.id,
																quantity: clamp(target.min, target.valueAsNumber, target.max),
																offer: target.dataset.offer,
															};

															await cart.add(item);
														}
													}
												})
											]
										}),
										create('div', {
											children: [
												create('b', { text: 'Total: ' }),
												create('span', { text: '$' + (price * quantity).toFixed(2) })
											]
										}),
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
				}),
			}),
			create('div', {
				classList: ['cart-btns', 'flex', 'row', 'wrap', 'space-evenly'],
				children: [
					create('button', {
						type: 'button',
						classList: ['btn', 'btn-primary'],
						events: { click: ({ target }) => target.closest('dialog').close() },
						text: 'Back to Shopping',
					}),
					create('button', {
						type: 'button',
						classList: items.length === 0
							? ['btn', 'btn-primary', 'checkout-btn', 'disabled']
							: ['btn', 'btn-primary', 'checkout-btn'],
						text: 'Continue to Checkout',
						events: {
							click: async ({ currentTarget }) => {
								try {
									currentTarget.disabled = true;
									const { paymentIntent } = await createPaymentRequest();
									redirect(PAGES.checkout, { params: { token: paymentIntent }});
								} catch(err) {
									currentTarget.disabled = false;
									console.error(err);
								}
							}
						}
					})
				]
			}),
		]
	});

	on(cart, 'update', ({ detail }) => {
		document.querySelector('.checkout-btn').classList.toggle('disabled', detail.newValue.length === 0);
	});

	document.body.append(dialog);
	dialog.showModal();

	if (signal instanceof AbortSignal) {
		signal.addEventListener('abort', () => dialog.close(), { once: true });
	}

	return promise;
}

if (location.pathname.startsWith(PAGES.checkout.url.pathname)) {
	const params = new URLSearchParams(location.search);

	if (params.has('payment_intent_client_secret') && params.has('redirect_status')) {
		//@TODO verify payment_intent_client_secret
		switch(params.get('redirect_status')) {
			case 'succeeded': {
				new Cart().empty();

				const dialog = create('dialog', {
					children:[
						create('h2', { text: 'Payment Successful' }),
						create('p', { text: 'Continue to home page.' }),
						create('div', {
							classList: ['center'],
							children: [
								create('a', {
									href: PAGES.home.url.href,
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
	} else if (location.search.includes('token=')) {
		Promise.all([
			getPaymentRequest(),
			getStripeKey(),
		]).then(async ([{ paymentRequest, paymentIntent }, key]) => {
			const form = new HTMLStripePaymentFormElement(key, paymentIntent.client_secret, {
				...paymentRequest,
				config: {
					returnURL: new URL(location.pathname, location.origin).href,
				}
			});

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
							href: PAGES.store.url.href,
							text: 'Back to Store',
						}),
					]
				}),
			);
			document.getElementById('main').append(form);
		});
	}
} else if(location.pathname === PAGES.store.url.pathname) {
	loadStoreItems().then(() => {
		const params = new URLSearchParams(location.search);

		on('#checkout-btn', 'click', () => reviewCart(new Cart()));

		on('#store-filter', 'submit', event => {
			event.preventDefault();
			const data = new FormData(event.target);
			const seller = data.get('seller');
			const category = data.get('category');
			const url = new URL(location.pathname, location.origin);

			if (typeof seller === 'string' && seller.length !== 0) {
				url.searchParams.set('seller', seller);
			} else {
				url.searchParams.delete('seller');
			}

			if (typeof category === 'string' && category.length !== 0) {
				url.searchParams.set('category', category);
			} else {
				url.searchParams.delete('category');
			}

			location.href = url.href;
		});

		on('#store-filter', 'reset', ({ target }) => target.closest('dialog').close());

		if ('IntersectionObserver' in globalThis) {
			intersect('.product-listing', intersectCallback);
		}

		if (params.has('seller')) {
			document.getElementById('search-seller').value = params.get('seller');
		}

		if (params.has('category')) {
			document.getElementById('search-category').value = params.get('category');
		}

		if (location.hash.length === 37) {
			showProductDetails(location.hash.substr(1));
		}

		document.body.append(create('button', {
			type: 'button',
			id: 'store-search-btn',
			title: 'Search Store',
			classList: ['btn', 'btn-primary', 'shadow-dark', 'no-border', 'round', 'fixed', 'bottom', 'left', 'z-4'],
			children: [
				useSVG('search', { height: 20, width: 20, fill: 'currentColor', classList: ['icon'] })
			],
			events: {
				click: () => document.getElementById('store-search-dialog').showModal(),
			}
		}));
	});
}
