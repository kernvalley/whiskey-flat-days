/* eslint-env node */
async function read(path, { encoding = 'utf-8', signal } = {}) {
	const { readFile } = require('node:fs');

	return new Promise((resolve, reject) => {
		readFile(path, { encoding, signal }, (err, data) => {
			if (Object.is(err, null)) {
				resolve(data);
			} else {
				reject(err);
			}
		});
	});
}

async function readYAML(path, {
	encoding = 'utf-8',
	signal,
} = {}) {
	const { parse } = require('yaml');
	const data = await read(path, { encoding, signal });
	return parse(data);
}

async function readJSON(path, {
	encoding = 'utf-8',
	signal
} = {}) {
	const data = await read(path, { encoding, signal });
	return JSON.parse(data);
}

exports.read = read;
exports.readYAML = readYAML;
exports.readJSON = readJSON;
