/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };
const  { HTTPError } = require('./http-error.cjs');

exports.handler = async function(event) {
	try {
		switch(event.httpMethod) {
			case 'GET': {
				const { getProducts } = require('./store.cjs');

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
						throw new HTTPError(`Could not find product with id "${event.queryStringParameters.id}"`, { status: 404 });
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
						throw new HTTPError(`No results for seller "${seller}"`, { status: 404 });
					}
				} else {
					const products = await getProducts();

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify(products),
					};
				}
			}

			default:
				throw new HTTPError(`Unsupported HTTP Method: ${event.httpMethod}`, { status: 405 });
		}
	} catch(err) {
		console.error(err);
		if (err instanceof HTTPError) {
			return err.send();
		} else {
			return {
				statusCode: 500,
				headers,
				body: JSON.stringify({
					error: {
						message: 'An unknown error occured',
						status: 500,
					}
				})
			};
		}
	}
};
