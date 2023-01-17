/* eslint-env node */
const methods = ['GET', 'POST', 'OPTIONS'];
const collection = 'checkout';

function toCurrency(num) {
	return parseFloat(num.toFixed(2));
}

function getTotal({ displayItems = [], modifiers: { additionalDisplayItems = [] } = {}}) {
	const total = [...displayItems, ...additionalDisplayItems]
		.reduce((total, { amount: { value = 0 } = {}}) => total + value, 0);

	return toCurrency(total);
}

async function calculateOrderAmount(req) {
	return parseInt(getTotal(req) * 100);
}

async function createOrder({
	details: {
		id,
		displayItems = [],
		total: {
			label,
			amount: { value: total = NaN, currency = 'USD' },
		},
		modifiers: {
			additionalDisplayItems = []
		}
	},
	options: {
		requestShipping = false,
	} = {},
}) {

	if (typeof id !== 'string') {
		throw new TypeError('Missing or invalid `clientSecret` / `details.id`');
	} else if (! Array.isArray(displayItems) || displayItems.length === 0) {
		throw new TypeError('Invalid `displayItems`');
	} else if (typeof total !== 'number' || Number.isNaN(total) || total <= 0) {
		throw new TypeError('Invalid `total.amount.value`');
	} else if (! Array.isArray(additionalDisplayItems)) {
		throw new TypeError('`additionalDisplayItems` must be an array');
	} else if (typeof label !== 'string') {
		throw new TypeError('Invalid or missing `total.label`');
	} else if (currency !== 'USD') {
		throw new Error('Only USD is a supported as a currency');
	} else {
		const { getCollection, getTimestamp } = require('./firebase.js');
		const db = getCollection(collection);

		await db.doc(id).set({
			paymentRequest: {
				details: {
					id,
					displayItems,
					modifiers: { additionalDisplayItems },
					total: { label, amount: { value: total, currency }},
				},
				options: {
					requestShipping,
				},
			},
			created: getTimestamp(),
			updated: getTimestamp(),
			email: null,
			dev: process.env.CONTEXT !== 'production',
			status: 'pending',
		});
	}
}

exports.handler = async function handler(event) {
	switch(event.httpMethod) {
		case 'OPTIONS':
			return {
				statusCode: 204,
				headers: {
					Options: methods.join(', '),
				}
			};

		case 'GET':
			if (typeof process.env.STRIPE_PUBLIC === 'string') {
				return {
					statusCode: 200,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						key: process.env.STRIPE_PUBLIC,
					})
				};
			} else {
				return {
					statusCode: 500,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						error: {
							message: 'Missing Stripe Public Key',
							status: 500,
						}
					})
				};
			}

		case 'POST':
			if (event.headers['content-type'] !== 'application/json') {
				return {
					statusCode: 400,
					error: {
						message: 'Not JSON',
						status: 400,
					}
				};
			} else if (typeof process.env.STRIPE_SECRET === 'string') {
				try {
					const req = JSON.parse(event.body);

					if (
						typeof req === 'object'
						&& ! Object.is(req, null)
						&& 'displayItems' in req
						&& (
							! Array.isArray(req.displayItems)
							|| req.displayItems.length === 0
						)
					) {
						throw new TypeError('Expected an array of items');
					}

					const { Stripe } = await import('stripe');
					const stripe = Stripe(process.env.STRIPE_SECRET);
					const paymentIntent = await stripe.paymentIntents.create({
						amount: await calculateOrderAmount(req),
						currency: 'usd',
						automatic_payment_methods: {
							enabled: true,
						},
					});


					req.id = paymentIntent.client_secret;
					req.total = { label: 'Total', amount: {
						value: getTotal(req),
						currency: 'USD',
					}};

					await createOrder({ details: req, options: { requestShipping: true } });

					return {
						statusCode: 200,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							clientSecret: paymentIntent.client_secret,
						})
					};
				} catch(err) {
					console.error(err);
					return {
						statusCode: 500,
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							error: {
								message: 'An unknown error occured',
								status: 500,
							},
						})
					};
				}
			} else {
				return {
					statusCode: 500,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						error: {
							message: 'No Stripe API key set',
							status: 500,
						},
					})
				};
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
				})
			};
	}
};
