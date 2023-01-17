/* eslint-env node */
const ENV_KEY = 'FIREBASE_CERT';

function getTimestamp(ts = Date.now(), ns = 0) {
	const { Timestamp } = require('firebase-admin/firestore');
	return new Timestamp(Math.floor(ts / 1000), ns);
}

function getApp({ envKey = ENV_KEY } = {}) {
	if (typeof process.env[envKey] !== 'string') {
		throw new Error('No Service Account set in `process.env`');
	} else {
		const { initializeApp, cert } = require('firebase-admin/app');
		const serviceAccount = JSON.parse(process.env[envKey]);
		const app = initializeApp({
			credential: cert(serviceAccount),
		}, 'temp-' + Date.now());

		return app;
	}
}

function getCollection(collection, { envKey = ENV_KEY } = {}) {
	if (typeof collection !== 'string') {
		throw new TypeError('Invalid collection');
	} else {
		const app = getApp(envKey);
		const { getFirestore } = require('firebase-admin/firestore');
		const db = getFirestore(app);
		return db.collection(collection);
	}
}

async function loggedIn() {
	return true;
}

module.exports.getTimestamp = getTimestamp;
module.exports.getApp = getApp;
module.exports.getCollection = getCollection;
module.exports.loggedIn = loggedIn;
