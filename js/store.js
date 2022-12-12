import { on, create } from 'https://cdn.kernvalley.us/js/std-js/dom.js';

on('button.add-to-cart','click', () => {
	const dialog = create('dialog', {
		children: [
			create('p', {
				classList: ['status-box','info'],
				text: 'WFD Store is in demo mode. Purchases are currently not enabled.'
			}),
			create('div', {
				classList: ['center'],
				children: [
					create('button', {
						classList: ['btn', 'btn-reject'],
						text: 'Close',
						events: { click: ({ target }) => target.closest('dialog').close() },
					})
				]
			})
		],
		events: { close: ({ target }) => target.remove() },
	});

	document.body.append(dialog);
	dialog.showModal();
});
