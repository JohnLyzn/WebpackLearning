/* eslint-disable */
require('eventsource-polyfill');
// Provider HMR and refresh automicaly
const ENV_STORAGE_KEY = '#webpack-dev#env#session';
const hotClient = require('webpack-hot-middleware/client?noInfo=true&reload=true');
hotClient.subscribe(function(event) {
	if (event.action === 'reload') {
		window.location.reload();
	}
	if(event.env) {
		const isFirst = ! sessionStorage.getItem(ENV_STORAGE_KEY);
		sessionStorage.setItem(ENV_STORAGE_KEY, event.env);
		if(isFirst) {
			window.location.reload();
		}
	}
});
// 加载环境变量
const env = sessionStorage.getItem(ENV_STORAGE_KEY);
if(env) {
	const args = JSON.parse(env);
	for(let key in args) {
		if(key.indexOf('Url') == -1) {
			continue;
		}
		args[key] = encodeURI(decodeURIComponent(args[key]));
	}
	Object.assign(window, args);
}
