export const KEY= 'cart';
const priority = 'background';

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
			priority,
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
			priority,
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

	async getQueryString({ signal } = {}) {
		const cart = await this.getAll({ signal });

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

	async has(id, { signal } = {}) {
		const item = await this.get(id, { signal });
		return typeof item === 'object' && ! Object.is(item, null);
	}

	async getAll({ signal } = {}) {
		await this.ready;
		const { key } = protectedData.get(this);
		return get({ key, signal });
	}

	async get(id, { signal } = {}) {
		const items = await this.getAll({ signal });
		return items.find(item => item.id === id);
	}

	async add({ id, quantity = 1, offer }, { signal } = {}) {
		if (typeof id !== 'string') {
			throw new TypeError('Product id must be a string');
		} else if (! Number.isSafeInteger(quantity)) {
			throw new TypeError('quantity must be an integer');
		} else if (quantity < 1) {
			await this.remove(id, { signal });
		} else {
			await this.ready;
			const { key } = protectedData.get(this);
			const oldValue = await this.getAll({ key, signal });
			const newValue = globalThis.structuredClone(oldValue);
			const current = oldValue.find(item => item.id === id && item.offer === offer);

			if (typeof current ==='object' && ! Object.is(current, null)) {
				current.quantity = quantity;
			} else {
				newValue.push({ id, quantity, offer });
			}

			await set(newValue, { key, signal });
			this.dispatchEvent(new CustomEvent('update', { detail: { newValue, oldValue }}));
		}
	}

	async empty({ signal } = {}) {
		await this.ready;
		const { key } = protectedData.get(this);
		await set([], { key, signal });
		this.dispatchEvent(new Event('emptied'));
	}

	async remove(item, { signal } = {}) {
		await this.ready;
		const { key } = protectedData.get(this);
		const items = await this.getAll({ key, signal });
		const start = items.length;
		const filtered = [...items.filter(({ id }) => id !== item)];

		if (start > filtered.length) {
			await set(filtered,{ key, signal });
			this.dispatchEvent(new CustomEvent('itemremoved', { detail: item }));
			this.dispatchEvent(new CustomEvent('update', {
				detail: { newValue: filtered, oldValue: items }
			}));
		}
	}
}
