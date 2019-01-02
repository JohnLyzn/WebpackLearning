/**
 * 缓存处理器, 提供缓存接口
 */
export default class CacheManager {

	constructor() {
		this._memoryCache = {};
	};

	get(key) {
		return this.getFrom(this._memoryCache, key);
	};

	getFrom(cache, key) {
		return cache[key];
	};

	cache(key, value, ...options) {
		this.cacheIn(this._memoryCache, key, value, options);
	};

	cacheIn(cache, key, value, ...options) {
		cache[key] = value;
	}
	
	remove(key) {
		this.removeFrom(this._memoryCache, key);
	};

	removeFrom(cache, key) {
		delete cache[key];
	}
	
	clearAll() {
		this._memoryCache = {};
	};
};