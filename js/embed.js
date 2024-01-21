customElements.whenDefined('wfd-events').then(WFDEvents => {
	const params = new URLSearchParams(location.search);
	const events = new WFDEvents();

	if (params.has('source')) {
		events.source = params.get('source');
	}

	if (params.has('theme')) {
		events.theme = params.get('theme');
		document.documentElement.dataset.theme = params.get('theme');
	}

	events.images = params.has('images');
	events.style.height = '100vh';
	events.style.width = '100%';
	document.body.append(events);
});
