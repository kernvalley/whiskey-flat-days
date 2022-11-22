customElements.whenDefined('wfd-events').then(() => {
	const WFDEvents = customElements.get('wfd-events');
	const params = new URLSearchParams(location.search);
	const events = new WFDEvents();

	if (params.has('source')) {
		events.source = params.get('source');
	}

	if (params.has('theme')) {
		events.theme = params.get('theme');

		try {
			document.querySelector('meta[name="color-scheme"]')
				.setAttribute('content', params.get('theme'));
		} catch(err) {
			console.error(err);
		}
	}

	events.images = params.has('images');
	events.style.height = '100vh';
	events.style.width = '100%';
	document.body.append(events);
});
