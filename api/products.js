/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };

exports.handler = async function(event) {
	switch(event.httpMethod) {
		case 'GET':
			try {
				const { getProducts } = require('./store.js');

				if ('id' in event.queryStringParameters) {
					const query = event.queryStringParameters.id.split('|');
					const product = await getProducts(query.length === 1 ? query[0] : query);

					if (typeof product === 'object' && ! Object.is(product, null)) {
						return {
							statusCode: 200,
							headers,
							body: JSON.stringify(product),
						};
					} else {
						return {
							statusCode: 404,
							headers,
							body: JSON.stringify({
								error: {
									message: `Could not find product with id "${event.queryStringParameters.id}"`,
									status: 404,
								}
							})
						};
					}
				} else if ('seller' in event.queryStringParameters) {
					const seller = event.queryStringParameters.seller;
					const products = await getProducts(item => item.manufacturer['@identifier'] === seller);

					if (Array.isArray(products) && products.length !== 0) {
						return {
							statusCode: 200,
							headers,
							body: JSON.stringify(products),
						};
					} else {
						return {
							statusCode: 404,
							headers,
							body: JSON.stringify({
								error: {
									message: `No results for seller "${seller}"`,
									status: 404,
								}
							}),
						};
					}
				} else {
					const products = await getProducts();

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify(products),
					};
				}
			} catch(err) {
				console.error(err);
				return {
					statusCode: 500,
					headers,
					body: JSON.stringify({
						error: {
							message: 'Error reading file',
							status: 500,
						}
					})
				};
			}

		default:
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					error: {
						message: 'Invalid request type',
						error: 400,
					}
				})
			};
	}
};
