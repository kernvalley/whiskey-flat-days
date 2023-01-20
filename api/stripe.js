/* eslint-env node */
const methods = ['GET', 'POST', 'OPTIONS'];
const { getTotal, createOrder, calculateOrderAmount } = require('./stripe-utils.js');


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
			if (typeof process.env.STRIPE_PUBLIC !== 'string') {
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
			} else {
				return {
					statusCode: 200,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						key: process.env.STRIPE_PUBLIC,
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

					req.id = paymentIntent.id;
					req.total = { label: 'Total', amount: {
						value: getTotal(req),
						currency: 'USD',
					}};

					await createOrder(paymentIntent, { details: req, options: { requestShipping: true } });

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
