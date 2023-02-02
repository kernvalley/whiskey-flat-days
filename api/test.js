/* eslint-env node */
const { HTTPError } = require('./http-error.js');
const { status } = require('./http-status.js');

exports.handler = async function() {
	try {
		const { getProduct, getSeller } = require('./firebase.js');

		const [product, seller] = await Promise.all([
			getProduct('0f6b5b5c-4467-4718-88f9-094c358fdd0b'),
			getSeller('2c563377-4df4-4bca-a26c-cb3303cd3b20'),
		]);

		return {
			statusCode: status.OK,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ product, seller }),
		};
	} catch(err) {
		console.log(err);
		if (err instanceof HTTPError) {
			return err.send();
		} else {
			return {
				statusCode: 500,
				headers: { 'Content-Type': 'application/json' },
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
