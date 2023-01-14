/* eslint-env node */
exports.handler = async function() {
	const { createDisplayItems } = require('./store.js');
	const query = '23e86dfc-f6f2-4251-92d2-09fdb58af65d:2|97062a2d-576d-4d97-b8fc-6c2edb690c42:1:e88477a1-50e1-41eb-be67-d2a0a3873558';
	return {
		statusCode: 200,
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(await createDisplayItems(query))
	};
};
