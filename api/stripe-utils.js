/* eslint-env node */

export const headers = { 'Content-Type': 'application/json' };

const { stripeRate, stripeFlatCharge, taxRate } = require('./stripe-consts.js');

export function toCurrency(num) {
	return parseFloat(num.toFixed(2));
}

export function getTotal({ displayItems = [], modifiers: { additionalDisplayItems = [] } = {}}) {
	const total = [...displayItems, ...additionalDisplayItems]
		.reduce((total, { amount: { value = 0 } = {}}) => total + value, 0);

	return toCurrency(total);
}

export async function calculateCardFee(req) {
	const total = getTotal(req.details);
	const fee = toCurrency((total * stripeRate) + stripeFlatCharge);
	return fee;
}

export async function calculateTaxes(req) {
	return toCurrency(getTotal(req) * taxRate);
}

export async function calculateShipping() {
	return 0;
}
