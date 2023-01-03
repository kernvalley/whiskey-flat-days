/* eslint-env node */
function calculateOrderAmount() {
	return 100;
}

exports.handler = async function(event) {
	switch(event.httpMethod) {
		case 'OPTIONS':
			return {
				statusCode: 204,
				headers: {
					Options: 'POST, OPTIONS',
				}
			};

		case 'POST':
			if (typeof process.env.STRIPE_SECRET === 'string') {
				try {
					const Stripe = require('stripe');
					const items = [];
					const stripe = Stripe(typeof process.env.STRIPE_SECRET);
					const paymentIntent = await stripe.paymentIntents.create({
						amount: calculateOrderAmount(items),
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
					return {
						statusCode: 500,
						headers: { 'Content-Type': 'application/json' },
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
					'Options': 'POST, OPTIONS',
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
