/* eslint-env node */
const {
	stripeRate, stripeFlatCharge, taxRate, productsFile, allowedAvailibility,
} = require('./stripe-consts.cjs');

const collection = 'orders';

function toCurrency(num) {
	return parseFloat(num.toFixed(2));
}

function getTotal({
	details: {
		displayItems = [],
		modifiers: {
			additionalDisplayItems = [],
		} = {},
	} = {},
} = {}) {
	const total = [...displayItems, ...additionalDisplayItems]
		.reduce((total, { amount: { value = 0 } = {}}) => total + value, 0);

	return toCurrency(total);
}

async function calculateCardFee(req) {
	const total = getTotal(req);
	const fee = toCurrency((total * stripeRate) + stripeFlatCharge);
	return fee;
}

async function calculateTaxes(req) {
	return toCurrency(getTotal(req) * taxRate);
}

async function calculateShipping(cart, { signal } = {}) {
	if (!Array.isArray(cart) || cart.length === 0) {
		return 0;
	} else {
		const { getProducts } = require('./store.cjs');
		const products = await getProducts(
			cart.map(({ id }) => id),
			{ signal }
		);

		const shipping = cart.reduce((total, { id: item, offer, quantity = 1, shipping }) => {
			const product = products.find(({ '@identifier': id }) => id === item);
			const offers = typeof offer === 'string'
				? product.offers.find(({ '@identifier': id }) => id === offer)
				: offers[0];

			if (typeof offers !== 'object') {
				throw new TypeError('Missing offer');
			} else if (! Array.isArray(offers.shippingDetails) || offers.shippingDetails.length === 0) {
				return total;
			} else if (typeof shipping === 'string') {
				const { shippingRate: { value = 0 }} = offers.shippingDetails.find(
					({ '@identifier': id }) => id === shipping
				);

				return total + (value * quantity);
			} else {
				const { shippingRate: { value = 0}} = offers.shippingDetails[0];
				return total + (value * quantity);
			}
		}, 0);

		return Math.max(0, shipping);
	}
}

function isAvailable({ offers }) {
	return offers.some(({ availability }) => allowedAvailibility.includes(availability));
}

async function createPaymentIntent({
	details: {
		total: {
			amount: {
				value: total,
			}
		}
	}
}) {
	if (typeof process.env.STRIPE_SECRET !== 'string') {
		throw new Error('Missing Stripe secret');
	} else if (typeof total !== 'number' || Number.isNaN(total) || total <= 0) {
		throw new TypeError('Invalid total for order');
	} else {
		const Stripe = require('stripe');
		const stripe = Stripe(process.env.STRIPE_SECRET);
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(total * 100),
			currency: 'usd',
			automatic_payment_methods: {
				enabled: true,
			},
		});

		return paymentIntent;
	}
}

async function getProducts(query = null, { signal } = {}) {
	const { readYAML } = require('./files.cjs');
	const { products } = await readYAML(productsFile, { signal });

	if (! Array.isArray(products)) {
		throw new Error('Products file did not parse as an array');
	}

	if (Array.isArray(query)) {
		return products.filter(({ '@identifier': id }) => query.includes(id));
	} else if(typeof query === 'string') {
		return products.find(({ '@identifier': id }) => id === query);
	} else if (query instanceof Function) {
		return products.filter(query);
	} else {
		return products;
	}
}

async function getSellers(query = null, { signal } = {}) {
	const { readYAML } = require('./files.cjs');
	const sellers = await readYAML(productsFile, { signal }).then(result => {
		delete result.products;
		return Object.values(result);
	});

	if (Array.isArray(query)) {
		return sellers.filter(({ '@identifier': id }) => query.includes(id));
	} else if(typeof query === 'string') {
		return sellers.find(({ '@identifier': id }) => id === query);
	} else if (query instanceof Function) {
		return sellers.filter(query);
	} else {
		return sellers;
	}
}

async function createOrder({ client_secret: clientSecret }, {
	details: {
		id,
		displayItems = [],
		total: {
			label,
			amount: { value: total = NaN, currency = 'USD' },
		},
		modifiers: {
			additionalDisplayItems = []
		}
	},
	options: {
		requestShipping = false,
	} = {},
}) {
	if (typeof clientSecret !== 'string') {
		throw new TypeError('`clientSecret` must be a string');
	} else if (typeof id !== 'string') {
		throw new TypeError('Missing or invalid `id`');
	} else if (! Array.isArray(displayItems) || displayItems.length === 0) {
		throw new TypeError('Invalid `displayItems`');
	} else if (typeof total !== 'number' || Number.isNaN(total) || total <= 0) {
		throw new TypeError('Invalid `total.amount.value`');
	} else if (! Array.isArray(additionalDisplayItems)) {
		throw new TypeError('`additionalDisplayItems` must be an array');
	} else if (typeof label !== 'string') {
		throw new TypeError('Invalid or missing `total.label`');
	} else if (currency !== 'USD') {
		throw new Error('Only USD is a supported as a currency');
	} else {
		// Only save orders in production
		const { getCollection, getTimestamp } = require('./firebase.cjs');
		const db = getCollection(collection);

		await db.doc(clientSecret).set({
			paymentRequest: {
				details: {
					id,
					displayItems,
					modifiers: { additionalDisplayItems },
					total: { label, amount: { value: total, currency }},
				},
				options: {
					requestShipping,
				},
			},
			created: getTimestamp(),
			updated: getTimestamp(),
			email: null,
			dev: process.env.CONTEXT !== 'production',
			status: 'pending',
		});
	}
}

async function getOrder(id) {
	if (typeof id !== 'string') {
		throw new TypeError('id must be a string');
	} else if (typeof process.env.STRIPE_SECRET !== 'string') {
		throw new TypeError('Missing or invalid Stripe secret');
	} else {
		const { getCollection } = require('./firebase.cjs');
		const db = await getCollection(collection);
		const doc = await db.doc(id).get();

		if (doc.exists) {
			const Stripe = require('stripe');
			const stripe = Stripe(process.env.STRIPE_SECRET);
			const { paymentRequest } = doc.data();
			const paymentIntent = await stripe.paymentIntents.retrieve(paymentRequest.details.id);
			return { paymentIntent, paymentRequest };
		} else {
			throw new Error(`Invalid order "${id}"`);
		}
	}
}

exports.toCurrency = toCurrency;
exports.getTotal = getTotal;
exports.calculateCardFee = calculateCardFee;
exports.calculateTaxes = calculateTaxes;
exports.calculateShipping = calculateShipping;
exports.isAvailable = isAvailable;
exports.getProducts = getProducts;
exports.getSellers = getSellers;
exports.createOrder = createOrder;
exports.getOrder = getOrder;
exports.createPaymentIntent = createPaymentIntent;
