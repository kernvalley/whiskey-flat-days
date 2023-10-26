/* eslint-env node */
const { HTTPError } = require('./http-error.js');
const { status } = require('./http-status.js');
exports.handler = async function() {
	try {
		throw new HTTPError('Not Implemented', { status: status.NOT_IMPLEMENTED });
	} catch(err) {
		console.log(err);

		if (err instanceof HTTPError) {
			return err.send();
		} else {
			return {
				statusCode: status.INTERNAL_SERVER_ERROR,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					error: {
						message: 'An unknown error occured',
						status: status.INTERNAL_SERVER_ERROR,
					}
				})
			};
		}
	}
};
