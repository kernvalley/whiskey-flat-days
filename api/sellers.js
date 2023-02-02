/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };
const { HTTPError } = require('./http-error.js');

exports.handler = async function(event) {
	try {
		switch(event.httpMethod) {
			case 'GET':

				if ('id' in event.queryStringParameters) {
					const query = event.queryStringParameters.id.split('|');

					if (query.length === 1) {
						const { getSeller } = require('./firebase.js');
						const seller = await getSeller(query[0]);

						return {
							statusCode: 200,
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify([seller]),
						};
					} else {
						const { getSellers } = require('./firebase.js');
						const sellers = await getSellers(...query);

						if (sellers.length === 0) {
							throw new HTTPError('Not found', { status: 404 });
						} else {
							return {
								statusCode: 200,
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify(sellers),
							};
						}
					}
				} else {
					const { getSellers } = require('./firebase.js');
					const sellers = await getSellers();
					return {
						statusCode: 200,
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(sellers),
					};
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
