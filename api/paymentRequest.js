/* eslint-env node */
const methods = ['GET'];
const { calculateShipping, calculateCardFee, calculateTaxes, getTotal } = require('./stripe-utils.js');
const { headers, currency } = require('./stripe-consts.js');

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

					req.details.total = {
						label: 'Total',
						amount: {
							value: getTotal(req),
							currency,
						}
					};

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
