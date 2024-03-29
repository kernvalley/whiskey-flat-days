import { firebase } from './consts.js';
import { initializeApp } from 'firebase/firebase-app.js';

import {
	getFirestore, collection, getDocs, getDoc, doc, addDoc, setDoc,
	enableIndexedDbPersistence,
} from 'firebase/firebase-firestore.js';

/**
 * @see https://firebase.google.com/docs/auth/web/manage-users?authuser=0
 */
import {
	getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
	onAuthStateChanged, updateProfile, sendPasswordResetEmail,
} from 'firebase/firebase-auth.js';

import { getStorage, ref, getDownloadURL, uploadBytes } from 'firebase/firebase-storage.js';

export const loadFirebase = (async () => {
	return new initializeApp(firebase.config);
}).once();

export const getAuthentication = (async () => {
	const app = await loadFirebase();
	return await getAuth(app);
}).once();

export async function loadStorage(bucket) {
	if (typeof bucket !== 'string') {
		throw new TypeError('invlalid bucket');
	} else {
		return await getStorage(await loadFirebase(), bucket);
	}
}

export async function getCurrentUser() {
	const auth = await getAuthentication();
	return auth.currentUser;
}

export async function isLoggedIn() {
	const user = await getCurrentUser();
	return user !== null;
}

export async function register(email, password, {
	displayName = undefined,
	photoURL = undefined,
} = {}) {
	const auth = await getAuthentication();
	const user = await createUserWithEmailAndPassword(auth, email, password);

	if (typeof displayName === 'string' || typeof photoURL === 'string') {
		await updateProfile(auth.currentUser, { displayName, photoURL });
	}

	return user;
}

export async function login(email, password) {
	const auth = await getAuthentication();
	return await signInWithEmailAndPassword(auth, email, password);
}

export async function logOut() {
	const auth = await getAuthentication();
	return await signOut(auth);
}

export async function onAuthenticationChanged(...args) {
	return onAuthStateChanged(await getAuthentication(), ...args);
}

export async function whenAuthenticationChanged() {
	return await new Promise(resolve => onAuthenticationChanged(user => resolve(user)));
}

export async function whenLoggedIn() {
	return await new Promise(resolve => {
		getCurrentUser().then(user => {
			if (typeof user === 'object' && ! Object.is(user, null)) {
				resolve(user);
			} else {
				onAuthenticationChanged(user => {
					if (typeof user === 'object' && ! Object.is(user, null)) {
						resolve(user);
					}
				});
			}
		});
	});
}

export async function resetPassword(email) {
	if (await isLoggedIn()) {
		throw new DOMException('User is signed in');
	} else {
		const auth = await getAuthentication();
		return await sendPasswordResetEmail(auth, email);
	}
}

export const loadFirestore = (async () => {
	const app = await loadFirebase();
	const db = getFirestore(app);
	await enableIndexedDbPersistence(db).catch(console.error);
	return db;
}).once();

export async function getCollection(name) {
	return await collection(await loadFirestore(), name);
}

export async function getDocuments(name) {
	const results = [];
	const docs = await getDocs(await getCollection(name));
	docs.forEach(doc => results.push(doc.data()));
	return results;
}

export async function getDocument(store, id) {
	const ref = doc(await loadFirestore(), store, id);
	const snap = await getDoc(ref);

	if (snap.exists()) {
		return snap.data();
	} else {
		throw new Error('Not found');
	}
}

export async function setDocument(store, id, data) {
	const db = await loadFirestore();
	const ref = await doc(db, store, id);
	await setDoc(ref, data);
}

export async function addDocument(store, data) {
	return await addDoc(getCollection(store), data);
}

export const getProducts = (async () => {
	const sellers = await getSellers();
	const products = await getDocuments('products');

	return products.map(product => {
		if (typeof product.manufacturer === 'string') {
			product.manufacturer = sellers.find(({ '@identifier': id }) => id === product.manufacturer);
		}

		product.offers = product.offers.map(offer => {
			if (typeof offer.seller === 'string') {
				offer.seller = product.manufacturer;
			}

			return offer;
		});

		return product;
	});
}).once();

export async function uploadFile(bucket, file, { name } = {}) {
	if (typeof bucket !== 'string') {
		throw new TypeError('bucket must be a string');
	} else if (! (file instanceof File)) {
		throw new TypeError('Not a file');
	} else {
		const storage = await loadStorage(bucket);
		const fileRef = typeof name === 'string' ? ref(storage, name) : ref(storage, file.name);

		return await uploadBytes(fileRef, file, {
			contentType: file.type,
		});
	}
}

export async function getFileURL(bucket, file) {
	if (typeof bucket !== 'string') {
		throw new TypeError('bucket must be a string');
	} else if (typeof file !== 'string') {
		throw new TypeError('file must be a string');
	} else {
		const storage = await loadStorage(bucket);
		const fileRef = ref(storage, file);
		return await getDownloadURL(fileRef);
	}
}

export const getProduct = id => getDocument('products', id);

export const getLoggedInSeller = (async () => {
	await whenLoggedIn();
	const user = await getCurrentUser();

	if (typeof user === 'object' && ! Object.is(user, null)) {
		return await getDocument('sellers', user.uid);
	}
}).once();

export async function createProduct(product) {
	if (! await isLoggedIn()) {
		throw new Error('You must be logged in to create a product');
	} else if (typeof product !== 'object' || Object.is(product, null)) {
		throw new TypeError('product must be a schema.org/Product object');
	} else if (typeof product['@identifier'] !== 'string') {
		throw new TypeError('Invalid product object');
	} else {
		return await setDocument('products', product['@identifier'], product);
	}
}

export async function createSeller(seller, id) {
	if (! await isLoggedIn()) {
		throw new Error('You must be logged in');
	} else if (typeof seller !== 'object' || Object.is(seller, null)) {
		throw new TypeError('Invalid seller data');
	} else if (typeof seller['@identifier'] !== 'string') {
		throw new TypeError('Invalid seller object');
	} else {
		return await setDocument('sellers', id || seller['@identifier'], seller);
	}
}

export const getSellers = (async () => {
	return await getDocuments('sellers');
}).once();

export const getSeller = id => getDocument('sellers', id);
