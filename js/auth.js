import { on, each } from '@shgysk8zer0/kazoo/dom.js';
import { md5 } from '@shgysk8zer0/kazoo/hash.js';
import { showDialog } from '@shgysk8zer0/kazoo/error-handler.js';
import { isObject } from '@shgysk8zer0/kazoo/utility.js';
import { register, login, resetPassword, whenLoggedIn } from './firebase.js';
import { redirect, getPages } from './functions.js';
const url = new URL(location.href);

if (url.searchParams.has('redirect')) {
	each('.user-form a.btn', el => {
		const href = new URL(el.href, document.baseURI);
		href.searchParams.set('redirect', url.searchParams.get('redirect'));
		el.href = href;
	});
}

getPages().then(pages => {
	switch(url.pathname) {
		case pages.register.url.pathname:
			whenLoggedIn().then(() => {
				if (url.searchParams.has('redirect')) {
					redirect(url.searchParams.get('redirect'));
				} else {
					redirect(pages.home);
				}
			});

			on('#registration', 'submit', async event => {
				event.preventDefault();
				const data = new FormData(event.target);
				const hash = await md5(data.get('email'));
				const photoURL = new URL(hash, 'https://secure.gravatar.com/avatar/');
				photoURL.searchParams.set('s', 256);
				photoURL.searchParams.set('d', 'mm');

				const user = await register(data.get('email'), data.get('password'), {
					photoURL: photoURL.href,
					displayName: data.get('displayName'),
				}).catch(err => {
					showDialog(err, { signal: AbortSignal.timeout(5000), level: 'warn' });
				});
				console.log({ user });

				if (isObject(user)) {
					if (url.searchParams.has('redirect')) {
						redirect(url.searchParams.get('redirect'));
					} else {
						redirect('/');
					}
				}
			});

			break;

		case pages.login.url.pathname:
			whenLoggedIn().then(() => {
				if (url.searchParams.has('redirect')) {
					redirect(url.searchParams.get('redirect'));
				} else {
					redirect('/');
				}
			});

			on('#login', 'submit', async event => {
				event.preventDefault();
				const data = new FormData(event.target);

				const user = await login(data.get('email'), data.get('password')).catch(err => {
					showDialog(err, { signal: AbortSignal.timeout(5000), level: 'warn' });
				});

				console.log({ user });

				if (isObject(user)) {
					if (url.searchParams.has('redirect')) {
						redirect(url.searchParams.get('redirect'));
					} else {
						redirect(pages.home);
					}
				}
			});

			break;

		case pages.passwordReset.url.pathname:
		case '/.well-known/change-password':
			whenLoggedIn().then(() => {
				if (url.searchParams.has('redirect')) {
					redirect(url.searchParams.get('redirect'));
				} else {
					redirect(pages.home);
				}
			});

			if (url.searchParams.has('email')) {
				document.getElementById('reset-email').value = url.searchParams.get('email');
			}

			on('#password-reset', 'submit', async event => {
				event.preventDefault();
				const data = new FormData(event.target);
				await resetPassword(data.get('email')).then(() => {
					if (url.searchParams.has('redirect')) {
						redirect(url.searchParams.get('redirect'));
					} else {
						redirect('/');
					}
				}).catch(err => {
					showDialog(err, { signal: AbortSignal.timeout(5000), level: 'warn' });
				});
			});

			break;
	}
});
