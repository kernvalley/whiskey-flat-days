/* eslint-env serviceworker */
import urlResolve from 'rollup-plugin-url-resolve';
import {terser} from 'rollup-plugin-terser';

export default {
	input: '_site/js/index.js',
	output: {
		file: '_site/js/index.min.js',
		format: 'iife',
		sourcemap: true,
	},
	plugins: [
		urlResolve(),
		terser(),
	],
};
