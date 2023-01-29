import { firebase } from './consts.js';
import { initializeApp, } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js';
import {
	getFirestore, collection, getDocs, getDoc, doc, addDoc, enableIndexedDbPersistence,
} from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js';
// import { } from 'https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js';

export const loadFirebase = (async () => {
	return new initializeApp(firebase.config);
}).once();

export const loadFirestore = (async () => {
	const app = await loadFirebase();
	const db = getFirestore(app);
	await enableIndexedDbPersistence(db);
	return db;
}).once();

export async function getCollection(name) {
	return await collection(await loadFirestore(), name);
}

export async function getDocuments(name) {
	return getDocs(await getCollection(name));
}

export async function getDocument(store, id) {
	const ref = doc(await getFirestore(), store, id);
	const snap = await getDoc(ref);

	if (snap.exists()) {
		return snap.data();
	} else {
		throw new Error('Not found');
	}
}

export async function addDocument(store, data) {
	return await addDoc(getCollection(store),data);
}

export const getProducts = (async () => {
	const products = [];
	const docs = await getDocuments('products');
	docs.forEach(doc => products.push(doc.data()));
	return products;
}).once();

export const getProduct = id => getDocument('products', id);

export const getSellers = (async () => {
	const sellers = [];
	const docs = await getDocuments('sellers');
	docs.forEach(doc => sellers.push(doc.data()));
	return sellers;
}).once();

export const getSeller = id => getDocument('sellers', id);
