import { HTMLStripePaymentFormElement } from 'https://cdn.kernvalley.us/components/stripe/payment-form.js';
import { on, create, enable, disable, value } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { getStripeKey, getSecret } from './stripe.js';
import { getJSON } from 'https://cdn.kernvalley.us/js/std-js/http.js';
import { Cart } from './Cart.js';

async function getCart() {
	const [products, cart] = await Promise.all([
		getJSON('/store/products.json'),
		new Cart().getAll(),
	]);

	return cart.map(({ id, quantity }) => {
		const product = products.find(({ '@identifier': product }) => product === id);

		if (typeof product === 'object') {
			return {
				label: `${product.name} [x${quantity}]`,
				amount: {
					value: quantity * product.offers[0].price,
					currency: 'USD',
				}
			};
		}
	});
	// return items.filter((_, i, arr) => Math.random() > 0.5 || i + 1 === arr.length)
	// 	.map(item => {
	// 		const qty = Math.max(1, Math.round(Math.random() * 3));
	// 		return {
	// 			label: `${item.name} x ${qty}`,
	// 			identifier: item['@identifier'],
	// 			amount: {
	// 				value: item.offers[0].price * qty,
	// 				currency: 'USD',
	// 			}
	// 		};
	// 	});
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
							label: 'Discount',
							amount: {
								value: -1.99,
								currency: 'USD',
							}
						}, {
							label: 'Shipping',
							amount: {
								value: 1.46,
								currency: 'USD',
							}
						}, {
							label: 'Taxes',
							amount: {
								value: toCurrency(getTotal({ displayItems }) * 0.0725),
								currency: 'USD',
							}
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
					value: toCurrency(getTotal(req.details) * 0.03 + 0.35),
					currency: 'USD',
				}
			});

			const clientSecret = await getSecret(req.details);
			const form = new HTMLStripePaymentFormElement(key, clientSecret, req);
			document.getElementById('main').append(form);
		});
	}
} else if(location.pathname.startsWith('/store')) {
	const cart = new Cart();

	cart.getAll().then(items => {
		items.forEach(({ id, quantity }) => {
			try {
				value(`#${id} input[name="quantity"]`, quantity);
			} catch(err) {
				console.error(err);
			}
		});
	});

	on('.cart-form', 'submit', async event => {
		event.preventDefault();

		try {
			const data = new FormData(event.target);
			disable(event.target.querySelectorAll('button, input'));

			await cart.add({
				id: data.get('id'),
				quantity: parseInt(data.get('quantity')),
				offer: data.get('offer'),
			});
		} catch(err) {
			console.error(err);
		} finally {
			enable(event.target.querySelectorAll('button, input'));
		}
	});

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
}
