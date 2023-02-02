/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };
const  { HTTPError } = require('./http-error.js');

exports.handler = async function(event) {
	try {
		switch(event.httpMethod) {
			case 'GET': {
				if ('id' in event.queryStringParameters) {
					const query = event.queryStringParameters.id.split('|');

					if (query.length === 1) {
						const { getProduct } = require('./firebase.js');
						const product = await getProduct(query[0]);
						return {
							statusCode: 200,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify([product]),
						};
					} else {
						const { getProducts } = require('./firebase.js');
						const products = await getProducts(...query);

						if (products.length === 0) {
							throw new HTTPError('Not found', { status: 404 });
						} else {
							return {
								statusCode: 200,
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(products),
							};
						}
					}
				} else if ('seller' in event.queryStringParameters) {
					const seller = event.queryStringParameters.seller;
					// @TODO Update to query instead of filtering
					const { getProducts } = require('./firebase.js');

					const products = await getProducts().then(products => products.filter(item => item.manufacturer['@identifier'] === seller));

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
					const { getProducts } = require('./firebase.js');
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
