/* eslint-env node */
const methods = ['GET'];
const headers = { 'Content-Type': 'application/json' };
const { HTTPError } = require('./http-error.cjs');
const { status } = require('./http-status.cjs');
const { currency } = require('./stripe-consts.cjs');
const {
	calculateShipping, calculateCardFee, calculateTaxes, getTotal,
} = require('./stripe-utils.cjs');

async function createDisplayItems(cart, { signal } = {}) {
	const { getProducts } = require('./store.cjs');
	const products = await getProducts(cart.map(({ id }) => id, { signal }));

	return products.map(product => {
		const { quantity = 1, offer } = cart.find(({ id }) => product['@identifier'] === id);

		if (! Number.isInteger(quantity) || quantity < 1) {
			throw new HTTPError(`Invalid quantity for ${product.name}`);
		} else {
			const offers = typeof offer === 'string'
				? product.offers.find(({ '@identifier': id}) => id === offer)
				: product.offers[0];

			if (typeof offers !== 'object' || Object.is(offers, null)) {
				throw new HTTPError(`Invalid offer for ${product.name}`);
			} else if (typeof offers.price !== 'number' || offers.price <= 0) {
				throw new HTTPError(`Invalid price for ${product.name}`);
			} else {
				return {
					label: quantity === 1 ? product.name : `${product.name} [x${quantity}]`,
					amount: {
						value: parseFloat((offers.price * quantity).toFixed(2)),
						currency: 'USD',
					}
				};
			}
		}
	});
}
async function createPaymentRequest(items, { signal } = {}) {
	const displayItems = await createDisplayItems(items, { signal });

	if (! Array.isArray(displayItems) || displayItems.length === 0) {
		throw new TypeError('`displayItems` invalid');
	} else {
		const req = {
			details: {
				displayItems,
				modifiers: {
					additionalDisplayItems: [{
						label: 'Taxes',
						amount: {
							value: await calculateTaxes({ details: { displayItems }}),
							currency,
						}
					}, {
						label: 'Shipping',
						amount: {
							value: await calculateShipping(items),
							currency,
						},
					}]
				}
			},
			options: {
				requestShipping: true,
			}
		};

		req.details.modifiers.additionalDisplayItems.push({
			label: 'Processing Fee',
			amount: {
				value: await calculateCardFee(req),
				currency,
			}
		});

		req.details.total = {
			label: 'Total',
			amount: {
				value: getTotal(req),
				currency,
			}
		};

		return req;
	}
}

exports.handler = async function(event) {
	try {
		switch(event.httpMethod) {
			case 'GET':
				if (typeof event.queryStringParameters.id !== 'string') {
					throw new HTTPError('Missing required id param', { status: status.BAD_REQUEST });
				} else {
					const { getOrder } = require('./stripe-utils.cjs');
					const { paymentRequest, paymentIntent } = await getOrder(event.queryStringParameters.id);
					return {
						statusCode: status.OK,
						headers,
						body: JSON.stringify({ paymentRequest, paymentIntent }),
					};
				}
			case 'POST':
				if (event.headers['content-type'].toLowerCase() !== 'application/json') {
					throw new HTTPError('Body must be JSON', { status: status.BAD_REQUEST });
				} else {
					const items = JSON.parse(event.body);

					if (! Array.isArray(items) || items.length === 0) {
						throw new HTTPError('Invalid request body', { status: status.BAD_REQUEST });
					} else {
						const paymentRequest = await createPaymentRequest(items);
						const { createPaymentIntent, createOrder } = require('./stripe-utils.cjs');
						const paymentIntent = await createPaymentIntent(paymentRequest);
						paymentRequest.details.id = paymentIntent.id;
						await createOrder(paymentIntent, paymentRequest);
						return {
							statusCode: status.OK,
							headers,
							body: JSON.stringify({ paymentRequest, paymentIntent: paymentIntent.client_secret }),
						};
					}
				}

			default:
				throw new HTTPError(`Unsupported HTTP Method: ${event.httpMethod}`, {
					status: status.METHOD_NOT_ALLOWED,
				});
		}
	} catch(err) {
		console.error(err);

		if (err instanceof HTTPError) {
			return err.send({ Options: methods.join(',')});
		} else {
			return {
				statusCode: status.INTERNAL_SERVER_ERROR,
				headers,
				body: JSON.stringify({
					error: {
						message: 'An unknown error occured',
						status: status.INTERNAL_SERVER_ERROR,
					}
				}),
			};
		}
	}
};
