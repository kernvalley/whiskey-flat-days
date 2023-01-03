/* eslint-env node */
const methods = ['GET', 'POST', 'OPTIONS'];

async function calculateOrderAmount() {
	return 100;
}

export async function handler(event) {
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
			if (typeof process.env.STRIPE_SECRET === 'string') {
				try {
					const items = [];
					const Stripe = await import('stripe');
					const stripe = Stripe(process.env.STRIPE_SECRET);
					const paymentIntent = await stripe.paymentIntents.create({
						amount: await calculateOrderAmount(items),
						currency: 'usd',
						automatic_payment_methods: {
							enabled: true,
						},
					});

					console.log(event);

					return {
						statusCode: 200,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							clientSecret: paymentIntent.client_secret,
						})
					};
				} catch(err) {
					console.error(err);
					const { message, line, file }  =err;

					return {
						statusCode: 500,
						headers: {
							'Content-Type': 'application/json',
							'X-Stripe': process.env.STRIPE_SECRET,
						},
						body: JSON.stringify({
							error: {
								message: 'An unknown error occured',
								status: 500,
								err: { message, line, file },
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
}
