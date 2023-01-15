/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };
const methods = ['GET'];

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
					return {
						statusCode: 200,
						headers,
						body: JSON.stringify(await createDisplayItems(event.queryStringParameters.query))
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
