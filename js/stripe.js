import { getJSON } from 'https://cdn.kernvalley.us/js/std-js/http.js';
import { loadScript } from 'https://cdn.kernvalley.us/js/std-js/loader.js';
import { map } from 'https://cdn.kernvalley.us/js/std-js/dom.js';

const STRIPE = 'https://js.stripe.com/v3/';
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

export const getSecret = async (body = [{}], { signal } = {}) => {
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
};

export const loadStripe = (() => loadScript(STRIPE)).once();

export const getStripe = (async ({ signal } = {}) => {
	const [key] = await Promise.all([getStripeKey({ signal }), loadStripe()]);

	if (! ('Stripe' in globalThis)) {
		throw new Error('Stripe failed to load');
	} else {
		return globalThis.Stripe(key);
	}
}).once();

export const getElements = (async (items = [], {
	appearance = { theme: 'stripe' },
	signal,
} = {}) => {
	const [stripe, clientSecret] = await Promise.all([
		getStripe({ signal }),
		getSecret(items, { signal }),
	]);

	return stripe.elements({ appearance, clientSecret });
}).once();

export const createElement = async (elements, { type, selector, style, events }) => {
	const el = elements.create(type, { style });

	if (typeof events === 'object' && ! Object.is(events, null)) {
		Object.entries(events).forEach(([event, callback]) => el.on(event, callback));
	}

	el.mount(selector);
	return el;
};

export const initElements = async ({
	base = document.body,
	items,
	events,
	styles,
	theme,
	signal,
} = {}) => {
	const elements = await getElements(items, { theme, signal });

	return await Promise.all(map('[data-stripe-element][id]', el => {
		const type = el.dataset.stripeElement;

		return createElement(elements, {
			type: type,
			selector: `#${el.id}`,
			events: typeof events === 'undefined' ? undefined : events[type],
			style: typeof styles === 'undefined' ? undefined : styles[type],
		});
	}, { base: typeof base === 'string' ? document.forms[base] : base }));
};
