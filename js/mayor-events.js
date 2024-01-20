customElements.whenDefined('wfd-mayor-events').then(HTMLWFDMayorEventsElement => {
	const params = new URLSearchParams(location.search);
	const events = new HTMLWFDMayorEventsElement();

	if (params.has('theme')) {
		events.theme = params.get('theme');
		document.documentElement.dataset.theme = params.get('theme');
	}

	if (params.has('mayor')) {
		events.mayor = params.get('mayor');
	}

	if (params.has('heading')) {
		const el = document.createElement('span');
		el.slot = 'heading';
		el.textContent = params.get('heading');
		events.appendChild(el);
	}

	if (params.has('address')) {
		events.showAddress = true;
	}

	if (params.has('description')) {
		events.showDescription = true;
	}

	document.body.appendChild(events);
});
