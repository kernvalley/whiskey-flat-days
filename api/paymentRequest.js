/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };
const methods = ['GET'];
const stripeRate = 0.029;
const stripeFlatCharge = 0.3;
const taxRate = 0.0725;
const currency = 'USD';

function toCurrency(num) {
	return parseFloat(num.toFixed(2));
}

function getTotal({ displayItems = [], modifiers: { additionalDisplayItems = [] } = {}}) {
	const total = [...displayItems, ...additionalDisplayItems]
		.reduce((total, { amount: { value = 0 } = {}}) => total + value, 0);

	return toCurrency(total);
}

async function calculateCardFee(req) {
	const total = getTotal(req.details);
	const fee = toCurrency((total * stripeRate) + stripeFlatCharge);
	return fee;
}

async function calculateTaxes(req) {
	return toCurrency(getTotal(req) * taxRate);
}

async function calculateShipping() {
	return 0;
}

exports.handler = async function(event) {
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
					})
				};
			} else {
				const { createDisplayItems } = require('./store.js');
				const displayItems = await createDisplayItems(event.queryStringParameters.query);

				if (Array.isArray(displayItems) && displayItems.length !== 0) {
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

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify(req),
					};
				} else {
					return {
						statusCode: 404,
						headers,
						body: JSON.stringify({
							error: {
								message: 'Invalid query to create `displayItems`',
								status: 404,
							}
						})
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
				})
			};
	}
};
