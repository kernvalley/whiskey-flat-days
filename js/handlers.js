import { each, attr } from 'https://cdn.kernvalley.us/js/std-js/dom.js';

export function  searchDateTimeRange({ from = new Date('2020-02-14T11:00'), hours = 2 } = {}) {
	if (! (from instanceof Date)) {
		from = new Date(from) || new Date();
	}

	if (typeof hours !== 'number') {
		hours = parseInt(hours);
	}

	if (Number.isNaN(hours)) {
		hours = 1;
	}

	let to = new Date(from.toISOString());
	to.setHours(to.getHours() + hours);

	[...document.querySelectorAll('leaflet-marker.event-marker')].forEach(event => {
		const start = new Date(event.dataset.startDate);
		const end = new Date(event.dataset.endDate);
		event.hidden = ! (end >= from && start <= to);
	});
}

export async function eventSearchHandler(event) {
	event.preventDefault();
	const form = event.target;
	const toast = form.closest('toast-message');
	const data = new FormData(form);
	const from = new Date(`${data.get('day')}T${data.get('time')}`);
	searchDateTimeRange({from});
	const open = document.querySelectorAll('leaflet-marker.event-marker:not([hidden])');

	if (open.length === 1) {
		open.item(0).open = true;
	}

	toast.close();
}

export async function businessCategorySearch(event) {
	event.preventDefault();
	const form = event.target;
	const toast = form.closest('toast-message');
	const data = new FormData(form);
	const category = data.get('category').toLowerCase();

	if (typeof category === 'string' && category !== '') {
		each('leaflet-marker.business-marker[data-category]', marker => {
			marker.hidden = !marker.dataset.category.toLowerCase().includes(category);
		});
	} else {
		attr('leaflet-marker.business-marker', { hidden: false });
	}

	if (toast instanceof HTMLElement) {
		toast.close();
	}
}
