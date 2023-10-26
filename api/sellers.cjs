/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };
const { HTTPError } = require('./http-error.js');

exports.handler = async function(event) {
	try {
		switch(event.httpMethod) {
			case 'GET': {
				const { getSellers } = require('./store.js');

				if ('id' in event.queryStringParameters) {
					const query = event.queryStringParameters.id.split('|');
					const seller = await getSellers(query.length === 1 ? query[0] : query);

					if (typeof seller !== 'object' || Object.is(seller, null)) {
						throw new HTTPError(`Could not find seller with id "${event.queryStringParameters.id}"`, { status: 404 });
					} else {
						return {
							statusCode: 200,
							headers,
							body: JSON.stringify(seller),
						};
					}
				} else {
					const sellers = await getSellers();

					return {
						statusCode: 200,
						headers,
						body: JSON.stringify(sellers),
					};
				}
			}

			default:
				throw new HTTPError(`Unsupported HTTP Method: ${event.httpMethod}`, { status: 405 });
		}
	} catch(err) {
		console.error(err);

		if (err instanceof HTTPError) {
			return err.send({ Options: 'GET' });
		} else {
			return {
				statusCode: 500,
				headers,
				body: JSON.stringify({
					error: {
						message: 'An unknown error occured',
						status: 500
					}
				})
			};
		}
	}
};
