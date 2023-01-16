import { HTMLStripePaymentFormElement } from 'https://cdn.kernvalley.us/components/stripe/payment-form.js';
import { on, create, value, text, attr, data, disable, each } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { getStripeKey, getSecret } from './stripe.js';
import { getJSON } from 'https://cdn.kernvalley.us/js/std-js/http.js';
import { createImage } from 'https://cdn.kernvalley.us/js/std-js/elements.js';
import { Cart } from './Cart.js';
import { clamp } from 'https://cdn.kernvalley.us/js/std-js/math.js';
import { getDeferred } from 'https://cdn.kernvalley.us/js/std-js/promises.js';

const getProducts = (() => getJSON('/store/products.json')).once();

async function loadStoreItems({ signal } = {}) {
	const params = new URLSearchParams(location.search);
	const tmp = document.getElementById('item-preview-template').content;
	const products = params.has('seller')
		? await getSellerProducts(params.get('seller'),{ signal })
		: await getProducts();

	document.getElementById('product-list').append(...products.map(product => {
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
			if (! (target.closest('a, button, summary') instanceof HTMLElement)) {
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
	const seller = product.manufacturer;
	const tmp = document.getElementById('item-details-template').content.cloneNode(true);
	const shareURL = new URL(location.href);

	shareURL.hash = `#${id}`;
	text('.item-details-name[itemprop="name"]', product.name, { base: tmp });
	text('[itemprop="description"]', product.description, { base: tmp });
	text('.seller-name[itemprop="name"]', seller.name, { base: tmp });

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

async function getPaymentRequest({ signal } = {}) {
	const cart = new Cart();
	const url = new URL('/api/paymentRequest', document.baseURI);
	url.searchParams.set('query', await cart.getQueryString({ signal }));
	return await getJSON(url, { signal });
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
				})
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
					create('a', {
						href: '/store/checkout',
						role: 'button',
						classList: items.length === 0
							? ['btn', 'btn-primary', 'checkout-btn', 'disabled']
							: ['btn', 'btn-primary', 'checkout-btn'],
						text: 'Continue to Checkout',
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
			getPaymentRequest(),
			getStripeKey(),
		]).then(async ([req, key]) => {
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
		}));
	});
} else if(location.pathname === '/store/') {
	loadStoreItems().then(() => {
		on('#checkout-btn', 'click', () => reviewCart(new Cart()));

		if (location.hash.length === 37) {
			showProductDetails(location.hash.substr(1));
		}
	});
}
