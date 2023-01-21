/* eslint-env node */
const { HTTPError } = require('./http-error.js');

exports.handler = async function() {
	try {
		throw new HTTPError('Invalid request', { cause: new Error('You done fucked up!'), status: 400 });
	} catch(err) {
		if (err instanceof HTTPError) {
			console.log(err);
			return err.send({ 'X-TEST': 'FOO' });
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
