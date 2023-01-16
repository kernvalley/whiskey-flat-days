/* eslint-env node */
const headers = { 'Content-Type': 'application/json' };

exports.handler = async function(event) {
	switch(event.httpMethod) {
		case 'GET':
			try {
				const { getSellers } = require('./store.js');

				if ('id' in event.queryStringParameters) {
					const query = event.queryStringParameters.id.split('|');
					const seller = await getSellers(query.length === 1 ? query[0] : query);

					if (typeof seller === 'object' && ! Object.is(seller, null)) {
						return {
							statusCode: 200,
							headers,
							body: JSON.stringify(seller),
						};
					} else {
						return {
							statusCode: 404,
							headers,
							body: JSON.stringify({
								error: {
									message: `Could not find seller with id "${event.queryStringParameters.id}"`,
									status: 404,
								}
							})
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
