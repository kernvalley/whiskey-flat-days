/* eslint-env node */
const ENV_KEY = 'FIREBASE_CERT';

function toArray(items) {
	const results = [];
	items.forEach(item => results.push(item));
	return results;
}

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

async function getDocument(collection, id) {
	const ref = getCollection(collection).doc(id);
	const doc = await ref.get();

	if (!doc.exists) {
		throw new Error(`${id} not found in ${collection}`);
	} else {
		return doc.data();
	}
}

async function getProducts(...ids) {
	const collection = getCollection('products');

	if (ids.length === 0) {
		const results = await collection.get();

		if (results.empty) {
			return [];
		} else {
			return Promise.all(toArray(results).map(doc => doc.data()));
		}
	} else {
		const results = await collection.where('@identifier', 'in', ids).get();

		if (results.empty) {
			return [];
		} else {
			return Promise.all(toArray(results).map(doc => doc.data()));
		}
	}
}

const getProduct = async id => await getDocument('products', id);

async function getSellers(...ids) {
	const collection = getCollection('sellers');

	if (ids.length === 0) {
		const results = await collection.get();

		if (results.empty) {
			return [];
		} else {
			return Promise.all(toArray(results).map(doc => doc.data()));
		}
	} else {
		const results = await collection.where('@identifier', 'in', ids).get();

		if (results.empty) {
			return [];
		} else {
			return Promise.all(toArray(results).map(doc => doc.data()));
		}
	}
}

const getSeller = async id => await getDocument('sellers', id);

module.exports.getTimestamp = getTimestamp;
module.exports.getApp = getApp;
module.exports.getDB = getDB;
module.exports.getCollection = getCollection;
module.exports.getDocument = getDocument;
module.exports.getProducts = getProducts;
module.exports.getProduct = getProduct;
module.exports.getSellers = getSellers;
module.exports.getSeller = getSeller;
module.exports.loggedIn = async () => true;
