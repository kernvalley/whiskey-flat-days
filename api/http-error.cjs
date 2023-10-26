/* eslint-env node */

exports.HTTPError = class HTTPError extends Error {
	constructor(message, { status = 500, cause } = {}) {
		super(message, { cause });

		if (! Number.isInteger(status) || status < 100 || status > 600) {
			throw new HTTPError('Invalid HTTP Status Code', 500);
		} else {
			this.status = typeof status === 'string' ? status : status.toString();
		}
	}

	toJSON() {
		return {
			error: { message: this.message, status: this.status },
		};
	}

	toString() {
		return JSON.stringify(this);
	}

	send(headers = {}) {
		return {
			statusCode: this.status,
			headers: { 'Content-Type': 'application/json', ...headers },
			body: JSON.stringify(this),
		};
	}
};
