export const KEY= 'cart';

async function set(cart, { key = KEY, signal } = {}) {
	if (! Array.isArray(cart)) {
		throw new TypeError('cart must be an array of items');
	} else if (typeof key !== 'string') {
		throw new TypeError('key must be a string');
	} else {
		await scheduler.postTask(() => {
			localStorage.setItem(key, JSON.stringify(cart));
		}, {
			signal,
		});
	}
}

async function get({ key = KEY, signal } = {}) {
	if (typeof key !== 'string') {
		throw new TypeError('key must be a string');
	} else {
		return await scheduler.postTask(() => {
			if (localStorage.hasOwnProperty(key)) {
				return JSON.parse(localStorage.getItem(key));
			} else {
				return [];
			}
		}, {
			signal,
		});
	}
}

const protectedData = new WeakMap();

export class Cart extends EventTarget {
	constructor(key) {
		super();
		protectedData.set(this, { key });
		this.dispatchEvent(new Event('ready'));
	}

	get ready() {
		return Promise.resolve();
	}

	async getQueryString() {
		const cart = await this.getAll();

		return cart.map(({ id, quantity = 1, offer }) => {
			if (typeof id !== 'string') {
				throw new TypeError('id must be set to a string');
			} else if (! Number.isSafeInteger(quantity) || quantity < 1) {
				throw new TypeError('quanitity must be an integer >= 1');
			} else if (typeof offer === 'string') {
				return `${id}:${quantity}:${offer}`;
			} else {
				return `${id}${quantity}`;
			}
		}).join('|');
	}

	async getAll({ signal } = {}) {
		await this.ready;
		const { key } = protectedData.get(this);
		return get({ key, signal });
	}

	async add({ id, quantity = 1, offer }, { signal } = {}) {
		let event;

		if (typeof id !== 'string') {
			throw new TypeError('Product id must be a string');
		} else if (! Number.isSafeInteger(quantity)) {
			throw new TypeError('quantity must be an integer');
		} else if (quantity < 1) {
			await this.remove(id, { signal });
		} else {
			await this.ready;
			const { key } = protectedData.get(this);
			const items = await this.getAll({ key, signal });
			const current = items.find(item => item.id === id && item.offer === offer);

			if (typeof current ==='object' && ! Object.is(current, null)) {
				const oldValue = {...current };
				current.quantity = quantity;
				event = new CustomEvent('update', { detail: { oldValue, newValue: current }});
			} else {
				items.push({ id, quantity, offer });
				event = new CustomEvent('update', { detail: { oldValue: null, newValue: current }});
			}

			await set(items, { key, signal });
			this.dispatchEvent(event);
		}
	}

	async empty({ signal } = {}) {
		await this.ready;
		const { key } = protectedData.get(this);
		await set([], { key, signal });
		this.dispatchEvent(new Event('emptied'));
	}

	async remove(item, { signal }) {
		await this.ready;
		const { key } = protectedData.get(this);
		const items = await this.getAll({ key, signal });
		const start = items.length;
		const filtered = [...items.filter(({ id }) => id !== item)];

		if (start > filtered) {
			await set(filtered,{ key, signal });
			this.dispatchEvent(new CustomEvent('itemremoved', { detail: item }));
		}
	}
}