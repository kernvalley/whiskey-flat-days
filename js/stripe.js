import { getJSON } from 'std-js/http.js';

const ENDPOINT = '/api/stripe';

export const getStripeKey = (async ({ signal } = {}) => {
	const { key, error } = await getJSON(ENDPOINT, { signal });

	if (typeof error !== 'undefined') {
		throw new Error(error.message);
	} else if (typeof key !== 'string' || key.length === 0) {
		throw new Error('Error loading stripe key');
	} else {
		return key;
	}
}).once();

export const getSecret = async (body = {}, { signal } = {}) => {
	const params = new URLSearchParams(location.search);

	if (params.has('payment_intent_client_secret')) {
		return params.get('payment_intent_client_secret');
	} else {
		const resp = await fetch(ENDPOINT, {
			method: 'POST',
			headers: new Headers({ 'Content-Type': 'application/json' }),
			body: JSON.stringify(body),
			signal,
		});

		if (resp.ok) {
			const { clientSecret } = await resp.json();
			return clientSecret;
		} else {
			throw new Error('Error creating payment request');
		}
	}
};
