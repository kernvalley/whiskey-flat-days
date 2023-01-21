/* eslint-env node */
const ENV_KEY = 'FIREBASE_CERT';

function getTimestamp(ts = Date.now(), ns = 0) {
	const { Timestamp } = require('firebase-admin/firestore');
	return new Timestamp(Math.floor(ts / 1000), ns);
}

function getApp({ envKey = ENV_KEY, name = 'temp-' + Date.now() } = {}) {
	if (typeof process.env[envKey] !== 'string') {
		throw new Error(`No Service Account set in \`process.env[${envKey}]\``);
	} else {
		const { initializeApp, cert } = require('firebase-admin/app');
		const serviceAccount = JSON.parse(process.env[envKey]);
		const app = initializeApp({
			credential: cert(serviceAccount),
		}, name);

		return app;
	}
}

function getDB({ envKey = ENV_KEY, name }) {
	const app = getApp({ envKey, name });
	const { getFirestore } = require('firebase-admin/firestore');
	return getFirestore(app);
}

function getCollection(collection, { envKey = ENV_KEY, name } = {}) {
	if (typeof collection !== 'string') {
		throw new TypeError('Invalid collection');
	} else {
		const db = getDB({ envKey, name });
		return db.collection(collection);
	}
}

async function loggedIn() {
	return true;
}

module.exports.getTimestamp = getTimestamp;
module.exports.getApp = getApp;
module.exports.getDB = getDB;
module.exports.getCollection = getCollection;
module.exports.loggedIn = loggedIn;
