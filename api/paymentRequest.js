/* eslint-env node */
const methods = ['GET'];
const headers = { 'Content-Type': 'application/json' };
const { HTTPError } = require('./http-error.js');
const { calculateShipping, calculateCardFee, calculateTaxes, getTotal } = require('./stripe-utils.js');
const { currency } = require('./stripe-consts.js');

async function getDisplayItems(cart, { signal } = {}) {
	const { getProducts } = require('./store.js');
	const products = await getProducts(cart.map(({ item }) => item, { signal }));

	return products.map(product => {
		const { quantity = 1, offer } = cart.find(({ item }) => product['@identifier'] === item);

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
async function getPaymentRequest(displayItems) {
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
							value: await calculateShipping({ displayItems }),
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

		console.log({ paymentRequest: req });

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
async function createPaymentRequest(query) {
	const { createDisplayItems } = require('./store.js');
	const displayItems = await createDisplayItems(query);

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
				if (typeof event.queryStringParameters.query !== 'string') {
					throw new HTTPError('Missing required query param', { status: 400 });
				} else {
					const req = await createPaymentRequest(event.queryStringParameters.query);

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify(req),
					};
				}
			case 'POST':
				if (event.headers['content-type'].toLowerCase() !== 'application/json') {
					throw new HTTPError('Body must be JSON', { status: 400 });
				} else {
					const items = JSON.parse(event.body);

					if (! Array.isArray(items) || items.length === 0) {
						throw new HTTPError('Invalid request body', { status: 400 });
					} else {
						const displayItems = await getDisplayItems(items);
						const paymentRequest = await getPaymentRequest(displayItems);
						return {
							statusCode: 200,
							headers,
							body: JSON.stringify(paymentRequest),
						};
					}
				}

			default:
				throw new HTTPError(`Unsupported HTTP Method: ${event.httpMethod}`, { status: 405 });
		}
	} catch(err) {
		console.error(err);
		if (err instanceof HTTPError) {
			return err.send({ Options: methods.join(',')});
		} else {
			return {
				statusCode: 500,
				headers,
				body: JSON.stringify({
					error: {
						message: 'An unknown error occured',
						status: 500,
					}
				}),
			};
		}
	}
};
