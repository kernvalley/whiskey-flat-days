---
layout: null
---
const pages = JSON.parse('{{ site.data.pages | jsonify }}');

export const PAGES = Object.fromEntries(
	Object.entries(pages).map(
		([key, { url, ...rest }]) => [key, { url: new URL(url, document.baseURI), ...rest }]
	)
);
