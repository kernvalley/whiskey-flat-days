/* eslint-env node */
const PRODUCTS_FILE = './_data/store.yml';

async function getProducts(query = null, { signal } = {}) {
	const { readYAML } = require('./files.js');
	const { products } = await readYAML(PRODUCTS_FILE, { signal });

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
	const { readYAML } = require('./files.js');
	const sellers = await readYAML(PRODUCTS_FILE, { signal }).then(result => {
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

async function createDisplayItems(query, { signal, currency = 'USD' } = {}) {
	if (typeof query !== 'string') {
		throw new TypeError('query must be a string');
	} else {
		const items = query.split('|').map(section => {
			const [item, quantity = 1, offer = null] = section.split(':');
			return {
				item,
				quantity: Math.max(1, parseInt(quantity)),
				offer,
			};
		});

		const products = await getProducts(items.map(({ item }) => item), { signal });

		return products.map(product => {
			const label = product.name;
			const identifier = product['@identifier'];
			const { quantity, offer } = items.find(({ item }) => item === identifier);

			if (typeof offer === 'string') {
				const { price: value } = product.offers.find(({ '@identifier': id }) => id === offer);

				if (typeof value === 'number' && ! Number.isNaN(value) && value > 0) {
					return {
						label: quantity === 1 ? label : `${label} [x${quantity}]`,
						amount: {
							value: parseFloat((value * quantity).toFixed(2)),
							currency,
						}
					};
				} else {
					throw new Error(`Could not find offer "${offer}" for product "${identifier}"`);
				}
			} else {
				const { price: value } = product.offers[0];

				if (typeof value === 'number' && ! Number.isNaN(value) && value > 0) {
					return {
						label,
						amount: {
							value: parseFloat((value * quantity).toFixed(2)),
							currency,
						}
					};
				} else {
					throw new Error(`Could not find offer "${offer}" for product "${identifier}"`);
				}
			}
		});
	}
}

exports.getProducts = getProducts;
exports.getSellers = getSellers;
exports.createDisplayItems = createDisplayItems;
