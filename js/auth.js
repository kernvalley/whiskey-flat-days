import { on } from 'https://cdn.kernvalley.us/js/std-js/dom.js';
import { md5 } from 'https://cdn.kernvalley.us/js/std-js/hash.js';
import { register, login, resetPassword } from './firebase.js';
const url = new URL(location.href);

switch(url.pathname) {
	case '/account/register':
		on('#registration', 'submit', async event => {
			event.preventDefault();
			const data = new FormData(event.target);
			const hash = await md5(data.get('email'));
			const photoURL = new URL(hash, 'https://secure.gravatar.com/avatar/');
			photoURL.searchParams.set('s', 256);
			photoURL.searchParams.set('d', 'mm');
			const user = await register(data.get('email'), data.get('password'), { photoURL });
			console.log({ user });
			
			if (url.searchParams.has('redirect')) {
				location.href = new URL(url.searchParams.get('redirect'), document.baseURI).href;
			} else {
				location.href = new URL('/', document.baseURI).href;
			}
		});
		break;

	case '/account/login':
		on('#login', 'submit', async event => {
			event.preventDefault();
			const data = new FormData(event.target);
			const user = await login(data.get('email'), data.get('password'));
			
			console.log({ user });
			
			if (url.searchParams.has('redirect')) {
				location.href = new URL(url.searchParams.get('redirect'), document.baseURI).href;
			} else {
				location.href = new URL('/', document.baseURI).href;
			}
		});
		break;

	case '/account/reset':
		if (url.searchParams.has('email')) {
			document.getElementById('reset-email').value = url.searchParams.get('email');
		}

		on('#password-reset', 'submit', async event => {
			event.preventDefault();
			const data = new FormData(event.target);
			const result = await resetPassword(data.get('email'));
			console.log(result);
			
			
			if (url.searchParams.has('redirect')) {
				location.href = new URL(url.searchParams.get('redirect'), document.baseURI).href;
			} else {
				location.href = new URL('/', document.baseURI).href;
			}
		});
		break;
}
