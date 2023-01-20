/* eslint-env node */
const methods = ['GET'];
const headers = { 'Content-Type': 'application/json' };
const { calculateShipping, calculateCardFee, calculateTaxes, getTotal } = require('./stripe-utils.js');
const { currency } = require('./stripe-consts.js');

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
					return {
						statusCode: 400,
						headers,
						body: JSON.stringify({
							error: {
								mesasge: 'Missing required query param',
								status: 400,
							}
						}),
					};
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
					return {
						statusCode: 400,
						headers,
						body: JSON.stringify({
							error: {
								message: 'Not JSON',
								status: 400,
							}
						}),
					};
				} else {
					const items = JSON.parse(event.body);

					if (! Array.isArray(items) || items.length === 0) {
						return {
							statusCode: 400,
							headers,
							body: JSON.stringify({
								error: {
									message: 'Invalid request body',
									status: 400,
								}
							})
						};
					} else {
						const { loadFromCart } = require('./store.js');

						const products = await loadFromCart(items).then(products => products.map(product => {
							const { offer, quantity = 1 } = items.find(({ id }) => id === product['@identifier']);

							if (typeof product.availability === 'string' && product.availability !== 'InStock') {
								throw new Error(`${product.name} is not available for sale`);
							} else if (! Number.isInteger(quantity) || quantity < 1) {
								throw new TypeError('Invalid quantity');
							} else if (typeof offer === 'string') {
								product.offers = product.offers.find(({ '@identifier': id }) => id === offer);

								if (typeof product.offers !== 'object' || Object.is(product.offers, null)) {
									throw new Error(`Unable to find offer: "${offer}"`);
								}
							} else {
								product.offers = product.offers[0];
							}

							product.offers['@context'] = 'https://schema.org';

							product.offers.itemOffered = {
								'@type': product['@type'] || 'Product',
								'@identifier': product['@identifier'],
							};

							product.offers.includesObject = {
								'@type': 'TypeAndQuantityNode',
								amountOfThisGood: quantity,
							};

							return product;
						}));
						// @TODO use `offer.includesObject`
						return {
							statusCode: 200,
							headers,
							body: JSON.stringify(products),
						};
					}
				}

			default:
				return {
					statusCode: 405,
					headers: {
						'Content-Type': 'application/json',
						'Options': methods.join(', '),
					},
					body: JSON.stringify({
						error: {
							message: `Unsupported HTTP Method: ${event.httpMethod}`,
							status: 405,
						}
					}),
				};
		}
	} catch(err) {
		console.error(err);
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
};
