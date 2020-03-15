import {getBaseUrl,getCacheManager,search,ajax,notify,toast,error} from 'common/env';
import {Config,ErrorLanguages} from 'common/constants';
import Utils from 'common/utils';
import {JSONPath} from 'jsonpath-plus';

const CACHE_SUFFIX = '_MAP';
const TASK_CACHE_NAME = 'TASK_MAP';
const PAGINATION_CACHE_NAME = 'PAGINATION_MAP';
const TASK_STATUS__DEFAULT = 0;
const TASK_STATUS__DONE = 1;
const TASK_STATUS__FAIL = 2;

/**
 * 基础数据服务(从旧的拷贝过来的, 需要新的以后改)
 */
export default class BaseService {

	constructor() {
		// 定义缓存对象的组织关系
		this.CACHE_RULES = {
			SINGLE: {
				identifyKeys: ['objType|model','objId'],
				get: (placeholders) => {
					let obj = this.getObjInCacheMap(placeholders['objId'], _getObjType(placeholders));
					if(! obj) {
						return {
							objs: [],
							singleResult: true,
						};
					}
					return {
						objs: [obj],
						singleResult: true,
					};
				},
				set: (placeholders, cachable) => {
					let rawObj = cachable.objs[0];
					if(! rawObj) {
						return {
							objs: [],
							singleResult: true,
						};
					}
					let obj = this.putObjInCacheMap(rawObj, _getObjType(placeholders), placeholders);
					return {
						objs: [obj],
						singleResult: true,
					};
				}
			},
			MULTI: {
				identifyKeys: ['objType|model', 'objIds'],
				get: (placeholders) => {
					let objs = this.getObjsInCacheMap(placeholders['objIds'], _getObjType(placeholders));
					if(! objs || objs.length != placeholders['objIds'].length) { /* 数量不一致当做没缓存 */
						return {
							objs: [],
							singleResult: false,
						};
					}
					return {
						objs: objs,
						singleResult: false,
					};
				},
				set: (placeholders, cachable) => {
					if(! cachable.objs || ! cachable.objs.length) {
						return {
							objs: [],
							singleResult: false,
						};
					}
					let objs = this.putObjsInCacheMap(cachable.objs, _getObjType(placeholders), placeholders);
					return {
						objs: objs,
						singleResult: false,
					};
				}
			},
			PARENT_CHILD: {
				identifyKeys: ['parentObjType', 'subObjType', 'parentObjId','subObjIdCacheKey'],
				get: (placeholders) => {
					let parentObj = this.getObjInCacheMap(placeholders['parentObjId'], placeholders['parentObjType']);
					if(! parentObj) {
						parentObj = this._generateUnfetchObjAndCache(placeholders['parentObjId'], placeholders['parentObjType'], placeholders);
						// throw new Error(parentObjType.displayName + '[' + parentObjId + ']未初始化数据');
					}
					let obj = this.getObjInCacheMap(parentObj[placeholders['subObjIdCacheKey']], placeholders['subObjType']);
					if(! obj) {
						return {
							objs: [],
							parentObj: parentObj,
							singleResult: true,
						};
					}
					return {
						objs: [obj],
						parentObj: parentObj,
						singleResult: true,
					};
				},
				set: (placeholders, cachable) => {
					let result = this.CACHE_RULES.SINGLE.set({
						objType: placeholders['subObjType'],
					}, cachable);
					let parentObj = this.getObjInCacheMap(placeholders['parentObjId'], placeholders['parentObjType']);
					if(! parentObj) {
						parentObj = this._generateUnfetchObjAndCache(placeholders['parentObjId'], placeholders['parentObjType'], placeholders);
					}
					parentObj[placeholders['subObjIdCacheKey']] = result.objs[0].id;
					this.putObjInCacheMap(parentObj, placeholders['parentObjType'], placeholders);
					return {
						objs: result.objs,
						parentObj: parentObj,
						singleResult: true,
					};
				}
			},
			PARENT_CHILDREN: {
				identifyKeys: ['parentObjType', 'subObjType', 'parentObjId','subObjIdsCacheKey'],
				get: (placeholders) => {
					let parentObj = this.getObjInCacheMap(placeholders['parentObjId'], placeholders['parentObjType']);
					if(! parentObj) {
						parentObj = this._generateUnfetchObjAndCache(parentObjId, placeholders['parentObjType'], placeholders);
						// throw new Error(parentObjType.displayName + '[' + parentObjId + ']未初始化数据');
					}
					let objs = this.getObjsInCacheMap(parentObj[placeholders['subObjIdsCacheKey']], placeholders['subObjType']);
					if(! objs || ! objs.length) {
						return {
							objs: [],
							parentObj: parentObj,
							singleResult: false,
						};
					}
					return {
						objs: objs,
						parentObj: parentObj,
						singleResult: false,
					};
				},
				set: (placeholders, cachable) => {
					let result = this.CACHE_RULES.MULTI.set({
						objType: placeholders['subObjType'],
					}, cachable);
					let parentObj = this.getObjInCacheMap(placeholders['parentObjId'], placeholders['parentObjType']);
					if(! parentObj) {
						parentObj = this._generateUnfetchObjAndCache(parentObjId, placeholders['parentObjType'], placeholders);
					}
					let cachedSubObjIds = parentObj[placeholders['subObjIdsCacheKey']];
					if(cachedSubObjIds) {
						for(let newObjId of Utils.asListByKey(result.objs, 'id')) {
							if(cachedSubObjIds.indexOf(newObjId) == -1) {
								cachedSubObjIds.push(newObjId);
							}
						}
					} else {
						cachedSubObjIds = Utils.asListByKey(result.objs, 'id');
					}
					parentObj[placeholders['subObjIdsCacheKey']] = cachedSubObjIds;
					this.putObjInCacheMap(parentObj, placeholders['parentObjType'], placeholders);
					return {
						objs: result.objs,
						parentObj: parentObj,
						singleResult: false,
					};
				}
			},
			NONE: {
				get: (placeholders) => {
					let objs = this.getAllObjsInCacheMap(_getObjType(placeholders));
					if(! objs || ! objs.length) {
						return {
							objs: [],
						};
					}
					return {
						objs: objs,
					};
				},
				set: (placeholders, cachable) => {
					return this.CACHE_RULES.MULTI.set(placeholders, cachable);
				},
			},
		};
	}

	/**
	 * 模版方法: 创建对象, 并加入缓存
	 */
	async createTemplate(params, callbacks, placeholders, task) {
		params = params || {};
		callbacks = callbacks || {};
		task = params.task || task;
		placeholders._ajaxMethod = placeholders['ajaxMethod'] || 'POST';
		placeholders._ajaxParamsHandleFn = null;
		placeholders._ajaxSuccessFn = async (json) => {
			if(_getResultFromJson(json, placeholders['resultPath']) === false) {
				return false;
			}
			const detailsHandleResult = await this._handleDetailsFetch(params, callbacks, placeholders, json);
			if(! detailsHandleResult) {
				if(Utils.isFunc(callbacks.onSuccess)) {
					callbacks.onSuccess(null, null, json);
				}
				return json;
			}
			return detailsHandleResult;
		};
		placeholders._ajaxErrorFn = null;
		return _ajaxTemplate(params, callbacks, placeholders, task);
	};
	
	/**
	 * 模版方法: 删除对象, 同时更新缓存
	 */
	async deleteTemplate(params, callbacks, placeholders, task) {
		params = params || {};
		callbacks = callbacks || {};
		task = params.task || task;
		if(params.isOnlyDeleteCache) {
			let handleDeleteResult = this._handleDeleteCache(params, callbacks, placeholders);
			if(! handleDeleteResult) {
				if(Utils.isFunc(callbacks.onSuccess)) {
					callbacks.onSuccess(null, null, null);
				}
				return;
			}
			return handleDeleteResult;
		}
		placeholders._ajaxMethod = placeholders['ajaxMethod'] || 'POST';
		placeholders._ajaxParamsHandleFn = null;
		placeholders._ajaxSuccessFn = (json) => {
			if(_getResultFromJson(json, placeholders['resultPath']) === false) {
				return false;
			}
			let handleDeleteResult = this._handleDeleteCache(params, callbacks, placeholders);
			if(! handleDeleteResult) {
				if(Utils.isFunc(callbacks.onSuccess)) {
					callbacks.onSuccess(null, null, json);
				}
				return json;
			}
			return handleDeleteResult;
		};
		placeholders._ajaxErrorFn = null;
		return _ajaxTemplate(params, callbacks, placeholders, task);
	};
	
	/**
	 * 模版方法: 更新对象信息, 同时更新缓存
	 */
	async updateTemplate(params, callbacks, placeholders, task) {
		params = params || {};
		callbacks = callbacks || {};
		task = params.task || task;
		placeholders._ajaxMethod = placeholders['ajaxMethod'] || 'POST';
		placeholders._ajaxParamsHandleFn = null;
		placeholders._ajaxSuccessFn = async (json) => {
			if(_getResultFromJson(json, placeholders['resultPath'])  === false) {
				return false;
			}
			const detailsHandleResult = await this._handleDetailsFetch(params, callbacks, placeholders, json);
			if(! detailsHandleResult) {
				if(Utils.isFunc(callbacks.onSuccess)) {
					callbacks.onSuccess(null, null, json);
				}
				return json;
			}
			return detailsHandleResult;
		};
		placeholders._ajaxErrorFn = null;
		return _ajaxTemplate(params, callbacks, placeholders, task);
	};
	
	/**
	 * 模版方法: 查询对象, 如果缓存中包含该信息则返回缓存
	 */
	async queryTemplate(params, callbacks, placeholders, task) {
		params = params || {};
		callbacks = callbacks || {};
		task = params.task || task;
		// 缓存搜索内容, 如果缓存找不到会进行远程请求
		let cacheSearches = placeholders['cacheSearches'] || params.cacheSearches;
		// 如果外层定义没有确定返回结果数目, 则由参数决定
		let singleResult = params['singleResult'] || placeholders['singleResult'];
		// 允许查找不到结果进行sucess的回调
		let canNotFound = params['canNotFound'] || placeholders['canNotFound'];
		// 处理成功的回调
		const success4Inner = (cacheable, json) => {
			if(singleResult === undefined) {
				singleResult = cacheable.singleResult;
			}
			if(Utils.isFunc(callbacks.onSuccess)) {
				let continueParams = callbacks.onSuccess(
					singleResult ? cacheable.objs[0] : cacheable.objs,
					cacheable.parentObj,
					json);
				if(continueParams) {
					let continueFn = placeholders['continueFn'];
					if(Utils.isFunc(continueFn)) {
						continueFn(continueParams, callbacks, placeholders);
					}
				}
			}
			if(singleResult) {
				if(! cacheable.objs[0] && canNotFound) {
					return undefined;
				}
				return cacheable.objs[0];
			}
			if(cacheable.objs) {
				return cacheable.objs;
			}
			return json;
		};
		// 默认不从缓存查找, 外部指定fromCache才从缓存中查找
		if(params.fromCache) {
			if(! params.searches) {
				let cacheable = this.handleCacheByRule('get', placeholders);
				if(cacheSearches) {
					// 非获取单个结果不允许进行缓存查询, 否则查出来的结果可能会有漏
					if(! singleResult) {
						throw new Error('非获取单个结果不允许进行缓存查询');
					}
					cacheable.objs = _search(cacheable.objs, cacheSearches, true);
				}
				if(params.pagination) {
					cacheable.objs = _setCachePagination(cacheable.objs, params.pagination, callbacks);
				}
				if(cacheable.objs.length) {
					return success4Inner(cacheable, {$isCache:true});
				}
			}
			if(params.preventAjax) {
				return;
			}
		}
		placeholders._ajaxMethod = placeholders['ajaxMethod'] || 'GET';
		placeholders._ajaxParamsHandleFn = (ajaxParams) => {
			let ajaxParamsIntercepter = placeholders['ajaxParamsIntercepter'];
			if(Utils.isFunc(ajaxParamsIntercepter)) {
				let cacheable = this.handleCacheByRule('get', placeholders);
				return ajaxParamsIntercepter(params, ajaxParams, cacheable.parentObj);
			}
		};
		placeholders._ajaxSuccessFn = (json) => {
			if(_getResultFromJson(json, placeholders['resultPath']) === false) {
				return false;
			}
			const rows = _getRowsFromJson(json, placeholders['rowsPath']);
			if(! rows || (! canNotFound && singleResult && rows.length == 0)) {
				return false;
			}
			return success4Inner(this.handleCacheByRule('set', placeholders, {objs: rows}), json);
		};
		placeholders._ajaxErrorFn = null;
		return _ajaxTemplate(params, callbacks, placeholders, task);
	};
	
	/**
	 * 根据ID列表获取缓存中的对象
	 * @param {*} objIds 
	 * @param {*} objType 
	 */
	getObjsInCacheMap(objIds, objType) {
		if(! objIds) {
			return null;
		}
		let objs = [];
		for(let i = 0; i < objIds.length; i ++) {
			let objId = objIds[i];
			let obj = this.getObjInCacheMap(objId, objType);
			if(obj) {
				objs.push(obj);
			}
		}
		return objs;
	};
	
	/**
	 * 根据ID获取缓存中的对象
	 * @param {*} objId 
	 * @param {*} objType 
	 */
	getObjInCacheMap(objId, objType) {
		if(! objId) {
			return null;
		}
		let obj = _getInCacheMap(_getCacheKey(objType), objId);
		if(obj) {
			return new objType(obj, true);
		}
		return null;
	};
	
	/**
	 * 添加批量对象到缓存池中
	 * @param {*} objs 
	 * @param {*} objType 
	 * @param {*} onlyMemery 
	 */
	putObjsInCacheMap(objs, objType, placeholders) {
		let result = [];
		for(let i = 0; i < objs.length; i ++) {
			result.push(this.putObjInCacheMap(objs[i], objType, placeholders));
		}
		return result;
	};
	
	/**
	 * 添加对象到缓存池中
	 * @param {*} obj 
	 * @param {*} objType 
	 * @param {*} placeholders 
	 */
	putObjInCacheMap(obj, objType, placeholders) {
		let cacheObj = new (objType)(obj, false, placeholders);
		if(! Utils.isString(cacheObj.id)) {
			throw new Error('请保证模型的id为字符串类型');
		}
		_putInCacheMap(_getCacheKey(objType), cacheObj, placeholders['onlyMemery']);
		return this.getObjInCacheMap(cacheObj.id, objType);
	};
	
	/**
	 * 获取在缓存池中某种类型的所有对象
	 * @param {*} objType 
	 */
	getAllObjsInCacheMap(objType) {
		let objs = _getInCacheMap(_getCacheKey(objType), null);
		if(objs) {
			let result = [];
			for(let i = 0; i < objs.length; i ++) {
				result.push(new (objType)(objs[i], true));
			}
			return result;
		}
		return [];
	};
	
	/**
	 * 批量移除缓存池中的对象
	 * @param {*} objIds 
	 * @param {*} objType 
	 */
	removeObjsInCacheMap(objIds, objType) {
		if(! objIds) {
			return;
		}
		for(let i = 0; i < objIds.length; i ++) {
			let objId = objIds[i];
			this.removeObjInCacheMap(objId, objType);
		}
	};
	
	/**
	 * 在缓存池中移除对象
	 * @param {*} objId 
	 * @param {*} objType 
	 */
	removeObjInCacheMap(objId, objType) {
		if(! objId) {
			return;
		}
		_removeInCacheMap(_getCacheKey(objType), objId);
	};

	/**
	 * 根据缓存规则处理缓存, 缓存规则见CACHE_RULES
	 * @param {*} type 处理类型, 对应缓存规则中的回调方法
	 * @param {*} placeholders 占位参数
	 * @param {*} cacheable 表示可缓存的对象, 在创建缓存的时候需要用到
	 */
	handleCacheByRule(type, placeholders, cacheable) {
		for(var key in this.CACHE_RULES) {
			if(! this.CACHE_RULES.hasOwnProperty(key)) {
				continue;
			}
			const rule = this.CACHE_RULES[key];
			if(! Utils.hasKeys(placeholders, rule.identifyKeys)) {
				continue;
			}
			return rule[type](placeholders, cacheable);
		}
		return this.CACHE_RULES.NONE[type](placeholders, cacheable);
	};

	/**
	 * 处理删除后删除指定ID(单个或集合)的缓存对象
	 */
	_handleDeleteCache(params, callbacks, placeholders, json) {
		let handleDeleteCachePlaceholdersFn = placeholders['handleDeleteCachePlaceholdersFn'];
		let handleDeleteCachePlaceholders;
		if(Utils.isFunc(handleDeleteCachePlaceholdersFn)) {
			handleDeleteCachePlaceholders = handleDeleteCachePlaceholdersFn(json, params);
			if(! handleDeleteCachePlaceholders) {
				return false;
			}
		}
		let objIds = placeholders['removeObjIds'] 
			|| (placeholders['removeObjId'] && [placeholders['removeObjId']]) 
			|| null;
		if(handleDeleteCachePlaceholders) {
			let fnObjIds = handleDeleteCachePlaceholders['removeObjIds']
			|| (handleDeleteCachePlaceholders['removeObjId'] && [handleDeleteCachePlaceholders['removeObjId']])
			|| null;
			if(fnObjIds) {
				objIds = fnObjIds;
			}
		}
		if(! objIds) {
			return false;
		}
		
		let deleteObjs = this.getObjsInCacheMap(objIds, placeholders['objType']);
		if(! placeholders['notCacheRemove']) {
			if(handleDeleteCachePlaceholders) {
				if(Utils.isFunc(handleDeleteCachePlaceholders['handleBeforeDeleteCache'])) {
					params.isOnlyDeleteCache = true;
					handleDeleteCachePlaceholders['handleBeforeDeleteCache'](params, deleteObjs, json);
				}
			}
			if(Utils.isFunc(callbacks.onBeforeDeleteCache)) {
				callbacks.onBeforeDeleteCache(objs, json);
			}
			this.removeObjsInCacheMap(objIds, placeholders['objType']);
		}
		
		let parentObj;
		let parentObjId = placeholders['parentObjId'];
		if(parentObjId) {
			parentObj = this.getObjInCacheMap(parentObjId, placeholders['parentObjType']);
			if(parentObj) {
				if(placeholders.hasOwnProperty('subObjIdsCacheKey')) {
					let parentObjIds = parentObj[placeholders['subObjIdsCacheKey']];
					if(parentObjIds) {
						for(let i = 0; i < objIds.length; i ++) {
							let index = parentObjIds.indexOf(objIds[i].toString());
							if(index != -1) {
								parentObjIds.splice(index, 1);
							}
						}
						parentObj[placeholders['subObjIdsCacheKey']] = parentObjIds;
					}
				} else if(placeholders.hasOwnProperty('subObjIdCacheKey')) {
					parentObj[placeholders['subObjIdCacheKey']] = null;
				}
				this.putObjInCacheMap(parentObj, placeholders['parentObjType']);
			}
		}
		if(Utils.isFunc(callbacks.onSuccess)) {
			callbacks.onSuccess(deleteObjs, parentObj, json);
		}
		return deleteObjs;
	}

	/**
	 * 处理创建/更新后获取指定ID(单个或集合)的新对象缓存
	 */
	async _handleDetailsFetch(params, callbacks, placeholders, json) {
		let handleDetailsFetchPlaceholdersFn = placeholders['handleDetailsFetchPlaceholdersFn'];
		if(! Utils.isFunc(handleDetailsFetchPlaceholdersFn)) {
			return false;
		}
		let detailFetchPlaceholders = handleDetailsFetchPlaceholdersFn(json, params);
		if(! detailFetchPlaceholders) {
			return false;
		}
		const detailFetchPlaceholderCopyKeys = ['objId', 'objIds', 'objType', 'model', 'url', 'ajaxParams'];
		const queryPlaceholders = {};
		for(let copyKey of detailFetchPlaceholderCopyKeys) {
			if(! detailFetchPlaceholders.hasOwnProperty(copyKey)
				|| ! detailFetchPlaceholders[copyKey]) {
				continue;
			}
			queryPlaceholders[copyKey] = detailFetchPlaceholders[copyKey];
		}
		return await this.queryTemplate({
			fromCache: detailFetchPlaceholders['fromCache'],
		}, {
			onSuccess: (objs) => {
				let singleResult = detailFetchPlaceholders['singleResult'];
				if(detailFetchPlaceholders.hasOwnProperty('objId')) {
					singleResult = true;
				}
				if(! Utils.isArray(objs)) {
					objs = [objs];
				}
				if(Utils.isFunc(callbacks.onBeforeUpdateCache)) {
					callbacks.onBeforeUpdateCache(singleResult ? objs[0] : objs, json);
				}
				let cacheable = this.handleCacheByRule('set', detailFetchPlaceholders, {objs: objs});
				if(singleResult === undefined) {
					singleResult = cacheable.singleResult;
				}
				if(Utils.isFunc(callbacks.onSuccess)) {
					callbacks.onSuccess(singleResult ? cacheable.objs[0] : cacheable.objs, cacheable.parentObj, json);
				}
			},
		}, queryPlaceholders);
	};
};

/**
 * 私有: 模版方法: 进行ajax请求
 */
const _ajaxTemplate = async (params, callbacks, placeholders, task) => {
	if(! params) {
		throw new Error('参数不能为null');
	}
	if(! callbacks) {
		throw new Error('回调不能为null');
	}
	// 加人默认错误处理回调
	_handleDefaultErrorCallbacks(callbacks);
	// 如果需要作为任务提交则加入任务处理队列(未完成)
	if(task && ! _postTask(task, callbacks)) {
		return;
	}
	// 准备请求参数
	const ajaxParams = placeholders['ajaxParams'] || {};
	// 如果有搜索参数, 则构建对应的搜索参数到请求参数中
	if(params.searches) {
		Utils.copyProperties(params.searches, ajaxParams);
	}
	// 内部定义回调 - 处理请求参数
	let ajaxParamsHandleFn = placeholders['_ajaxParamsHandleFn'];
	if(Utils.isFunc(ajaxParamsHandleFn)) {
		if(ajaxParamsHandleFn(ajaxParams)) {
			return;
		}
	}
	// 额外参数加入
	const copyParamNames = Config.COPY_PARAM_NAMES;
	for(let i = 0; i < copyParamNames.length; i ++ ) {
		const copyParamName = copyParamNames[i];
		if(! params.hasOwnProperty(copyParamName) || ! params[copyParamName]) {
			continue;
		}
		ajaxParams[copyParamName] = params[copyParamName];
	}
	// 处理分页
	if(params.pagination) {
		if(! _setPagination(params.pagination, ajaxParams, callbacks)) {
			return;
		}
	}
	// 格式化参数 
	for(let ajaxParamKey in ajaxParams) {
		if(! ajaxParams.hasOwnProperty(ajaxParamKey)) {
			continue;
		}
		// 移除无效值
		let ajaxParamVal = ajaxParams[ajaxParamKey];
		if(! Utils.isValidVariable(ajaxParamVal)) {
			delete ajaxParams[ajaxParamKey];
			continue;
		}
		// 略过文件类型
		if(Utils.isInstance(ajaxParamVal, File)) {
			continue;
		}
		// 格式化对象为json字符串
		if(Utils.isObject(ajaxParamVal) || Utils.isArray(ajaxParamVal)) {
			ajaxParams[ajaxParamKey] = JSON.stringify(ajaxParamVal);
		}
	}
	// 基本回调 - start
	if(Utils.isFunc(callbacks.onStart)) {
		callbacks.onStart();
	}
	// 发起请求
	let url = placeholders['url'];
	let method = placeholders['_ajaxMethod'] || placeholders['method'];
	if(! url) {
		url = getBaseUrl();
	} else {
		if(Utils.isArray(url)) {
			const urlArray = url;
			method = urlArray[0];
			url = urlArray[1];
		}
		if(url.startsWith('/')) {
			url = getBaseUrl() + url;
		}
	}
	// 获取请求结果
	const json = await ajax({
		url: url,
		type: method,
		data: ajaxParams,
		dataType: 'json',
		headers: placeholders['headers'],
		error: (response) => {
			// 如果有任务, 则标记任务已失败
			if(task) {
				_markTaskStatus(task, TASK_STATUS__FAIL);
			}
			// 内部定义回调 - 处理错误
			let ajaxErrorFn = placeholders['_ajaxErrorFn'];
			if(Utils.isFunc(ajaxErrorFn)) {
				ajaxErrorFn(response);
			}
			// 根据重试回调是否存在来调用内部定义回调 - 重试
			let retryFn = placeholders['_retryFn'];
			if(Utils.isFunc(retryFn)) {
				params.preventAjax = true;
				params.fromCache = true;
				retryFn();
			}
			// 基本回调 - error
			if(Utils.isFunc(callbacks.onError)) {
				callbacks.onError(response, placeholders['errorMsg']);
			}
			// 基本回调 - end
			if(Utils.isFunc(callbacks.onEnd)) {
				callbacks.onEnd();
			}
		},
	});
	// 如果有任务, 则标记任务已完成
	if(task) {
		_markTaskStatus(task, TASK_STATUS__DONE);
	}
	// 设置分页总数
	if(json && params.pagination) {
		let total = _getTotalFromJson(json, placeholders['totalPath']);
		if(total !== undefined) {
			_setPaginationTotal(params.pagination, total, callbacks);
		}
	}
	// 内部定义回调 - 请求成功处理
	let ajaxSuccessFn = placeholders['_ajaxSuccessFn'];
	let handleResult;
	if(Utils.isFunc(ajaxSuccessFn)) {
		handleResult = (json && await ajaxSuccessFn(json)) || false;
		if(handleResult === false) { /* 返回false表示失败 */
			// 通用错误识别和接口错误识别, 返回true说明被处理了
			if(Utils.isFunc(callbacks.onFail) && ! callbacks.onFail.default) {
				callbacks.onFail(json.msg || placeholders['errorMsg'], json);
			} else if(! _handleError(json, ['COMMON', placeholders['errorTag']], callbacks, placeholders)) {
				callbacks.onFail(json.msg || placeholders['errorMsg'], json);
			}
			// 根据重试回调是否存在来调用内部定义回调 - 重试
			let retryFn = placeholders['_retryFn'];
			if(Utils.isFunc(retryFn)) {
				params.preventAjax = true;
				params.fromCache = true;
				handleResult = await retryFn();
			}
		}
	}
	// 基本回调 - end
	if(Utils.isFunc(callbacks.onEnd)) {
		callbacks.onEnd();
	}
	return handleResult;
};

/**
 * 私有: 获取默认模型
 * @param {String} tag 该默认模型的tag
 */
const _getDefailtModel = (tag) => {
	class Model {
		constructor(row, isFromCache, placeholders) {
			if(Utils.isObject(row)) {
				Utils.copyProperties(row, this);
			} else {
				this.$value = row;
			}
			if(isFromCache) {
				return this;
			}
			if(placeholders && placeholders['model']) {
				const model = placeholders['model'];
				Utils.forEach(model, (rowKey, key) => {
					this[key.replace(/Key/g, '')] = this[rowKey];
				});
			}
			if(! this.id) {
				this.id = Utils.generateTemporyId();
			}
			this.id = this.id && this.id.toString();
		}
	}
	Model.typeName = (tag || '') + 'Model';
	Model.displayName = (tag || '') + '对象';
	return Model;
};

/**
 * 私有: 获取需要生成的对象类型
 * @param {Object} placeholders 
 * @
 */
const _getObjType = (placeholders) => {
	return placeholders['objType'] || _getDefailtModel(
		placeholders['tag'] || placeholders['errorTag']);
};

/**
 * 私有: 获取未远程获取的对象并添加到缓存中
 * @param {String} objId 任意指定的对象ID
 * @param {Any Model Type} objType 缓存模型类型
 */
const _generateUnfetchObjAndCache = (objId, objType, placeholders) => {
	const obj = new objType({
		id: objId,
		name:'#未获取#'
	}, true);
	return this.putObjInCacheMap(obj, objType, placeholders);
};

/**
 * 私有: 获取缓存模型的缓存名称
 * @param {Any Model Type} objType 缓存模型类型
 */
const _getCacheKey = (objType) => {
	if(! Utils.isString(objType.typeName)) {
		throw new Error('缓存的对象类型必须包含typeName属性');
	}
	return objType.typeName.toUpperCase() + CACHE_SUFFIX;
};

/**
 * 私有: 把数据模型添加到缓存中
 * @param {Sring} cacheKey 缓存名称
 * @param {Any Model} obj 机构数据模型, 需要有id属性
 */
const _putInCacheMap = (cacheKey, obj, onlyMemery) => {
	if(! cacheKey || ! obj || ! obj.id) {
		throw new Error('无法缓存的对象');
	}
	const cacheManager = getCacheManager();
	let map = cacheManager.get(cacheKey);
	if(! map) {
		map = {};
	}
	let oldObj = cacheManager.getFrom(map, obj.id);
	if(oldObj) {
		Utils.copyProperties(obj, oldObj);
	} else {
		cacheManager.cacheIn(map, obj.id, obj, onlyMemery);
	}
	cacheManager.cache(cacheKey, map, onlyMemery);
};

/**
 * 私有: 根据对象ID获取缓存中的数据模型
 * @param {Sring} cacheKey 缓存名称
 * @param {Number|String} id 查询的记录ID
 * @return {Any Model} 数据模型
 */
const _getInCacheMap = (cacheKey, id) => {
	const cacheManager = getCacheManager();
	let map = cacheManager.get(cacheKey);
	if(map) {
		if(id) {
			return cacheManager.getFrom(map, id);
		}
		return Utils.asList(map);
	}
	return null;
};

/**
 * 私有: 根据对象ID删除缓存中的数据模型
 * @param {Sring} cacheKey 缓存名称
 * @param {Number|String} id 删除的记录ID
 * @return {Any Model} 数据模型
 */
const _removeInCacheMap = (cacheKey, id) => {
	const cacheManager = getCacheManager();
	let map = cacheManager.get(cacheKey);
	if(map) {
		cacheManager.removeFrom(map, id);
		cacheManager.cache(cacheKey, map);
		return true;
	}
	return false;
};

/**
 * 在对象列表中搜索符合目标条件(可能多个, 全OR或全AND连接)的对象
 * @param {Object List} searchObjs 缓存对象列表
 * @param {Object List} searches 搜索内容
 */
const _search = (searchObjs, searches, strict) => {
	if(searchObjs.length == 0) {
		return null;
	}
	if(! searches) {
		return [];
	}
	let isAnd = ! searches.or;
	let searchResults = [];
	for(let key in searches) {
		if(! searches.hasOwnProperty(key) || ['or'].indexOf(key) != -1) {
			continue;
		}
		let searchValue = searches[key];
		let results = search(searchObjs, key, searchValue, strict);
		for(let i = 0; i < results.length; i ++) {
			let result = results[i];
			if(searchResults.indexOf(result) == -1) {
				searchResults.push(result);
			}
		}
		if(isAnd) {
			searchObjs = searchResults;
		}
	}
	if(searchResults.length == 0) {
		return null;
	}
	return searchResults;
};

/**
 * 私有: 处理来自后台的异常信息, 转换为用户可理解的输出, 与常量配置中的ErrorLanguages配合使用
 * @param {Object} json 后台传回来的错误信息
 * @param {String Array} types 指定识别的类型
 * @param {Function Object} callbacks 可用的回调
 */
const _handleError = (json, types, callbacks, placeholders) => {
	if(Utils.isString(types)) {
		types = [types];
	}
	const testErrorMsg = _getErrorMsgFromJson(json, placeholders['errorMsgPath']);
	const testErrorType = _getErrorTypeFromJson(json, placeholders['errorTypePath']);
	const defaultHandler = ErrorLanguages.DEFAULT_HANDLER;
	if(! defaultHandler) {
		return false;
	}
	for(let i = 0; i < types.length; i ++) {
		const type = types[i];
		const defs = ErrorLanguages[type];
		if(! defs) {
			return false;
		}
		for(let j = 0; j < defs.length; j ++) {
			const def = defs[j];
			const accept = def.accept;
			const handler = def.handler || defaultHandler;
			if(accept && ! accept(json)) {
				continue;
			}
			if(def.msgPiece && testErrorMsg && testErrorMsg.indexOf(def.msgPiece) != -1) {
				handler(json, callbacks);
				return true;
			}
			if(def.errorType && testErrorType && def.errorType == testErrorType) {
				handler(json, callbacks);
				return true;
			}
		}
	}
};

/**
 * 添加默认的回调
 * @param {Object} callbacks 回调对象
 */
const _handleDefaultErrorCallbacks = (callbacks) => {
	if(! callbacks.onTooFast) {
		callbacks.onTooFast = () => {
			toast('请慢点进行操作');
		};
		callbacks.onTooFast.default = true;
	}
	if(! callbacks.onPostSame) {
		callbacks.onPostSame = () => {
			toast('正在进行该项处理, 请耐心等待...');
		};
		callbacks.onPostSame.default = true;
	}
	if(! callbacks.onError) {
		callbacks.onError = (response, errorMsg) => {
			if(errorMsg) {
				notify('网络异常: ' + errorMsg);
			}
			error(response);
		};
		callbacks.onError.default = true;
	}
	if(! callbacks.onFail) {
		callbacks.onFail = (errorMsg, json) => {
			if(errorMsg) {
				notify(errorMsg);
			}
			error(json);
		};
		callbacks.onFail.default = true;
	}
};

/**
 * 私有: 对本地缓存的对象进行分页切割
 * @param {Object List} objs 缓存对象总列表
 * @param {Object} pagination 分页对象
 * @param {Object} callbacks 回调对象
 */
const _setCachePagination = (objs, pagination, callbacks) => {
	if(objs.length == 0) {
		return objs;
	}
	if(! pagination.page || ! pagination.count) {
		return objs;
	}
	
	pagination.fetchedTotal = objs.length;
	_setPagination(pagination, null, callbacks);
	
	let start = (pagination.page - 1) * pagination.count; /* 缓存分页忽略offset */
	let end = start + pagination.count;
	let result = objs.slice(start, end);
	if(result.length == 0) {
		pagination.cacheMissed = true;
		return null;
	} /* 即使不满足count的数量也返回 */
	return result;
};

/**
 * 私有: 设置分页的总数
 * @param {Object} pagination 分页对象
 * @param {Object} ajaxParams AJAX对象
 * @param {Object} callbacks 回调对象
 */
const _setPagination = (pagination, ajaxParams, callbacks) => {
	if(! pagination.id) {
		throw new Error('请指定分页ID, 建议使用时间戳!');
	}
	let command = pagination.command;
	let oldPagination = _getInCacheMap(PAGINATION_CACHE_NAME, pagination.id);
	if(! oldPagination) {
		oldPagination = {
			id: pagination.id,
		};
		command = 'reset';
	}
	let currentTime = new Date().getTime();
	if(oldPagination.$lastPagingTime 
		&& currentTime - oldPagination.$lastPagingTime <= Config.MIN_PAGING_INTERVEL) {
		return false;
	}
	oldPagination.$lastPagingTime = currentTime;
	switch(command) {
	case 'next':
		if(pagination.$pagingEnd) {
			// 最后一页了, 调用基本回调
			if(callbacks && Utils.isFunc(callbacks.onLastPage)) {
				callbacks.onLastPage(pagination);
			}
			return false;
		}
		if(pagination.fetchedTotal) {
			// 如果total是NaN则为初始化分页时使用的缓存, 这时应总能获取下一页直到真正请求获得真实总数
			if(! isNaN(oldPagination.total) && oldPagination.total == pagination.fetchedTotal) {
				oldPagination.$pagingEnd = true;
				// 最后一页了, 调用基本回调
				if(callbacks && Utils.isFunc(callbacks.onLastPage)) {
					callbacks.onLastPage(pagination);
				}
			}
			delete pagination.fetchedTotal;
		}
		/* cacheMissed在缓存按分页切割时进行设置的, 如果有这个字段表示缓存已经读完了,
			*  这时page已经时缓存最大页的下一页了(所以才会没有), 因此跳过页码增加的步骤 */
		if(! pagination.cacheMissed) {
			oldPagination.page ++;
		} else {
			delete pagination.cacheMissed;
		}
		break;
	case 'previous':
		if(oldPagination.page <= 1) {
			return false;
		}
		oldPagination.page --;
		break;
	case 'reset':
		oldPagination.count = pagination.count || 20;
		oldPagination.page = 1;
		oldPagination.offset = 0;
		oldPagination.total = NaN;
		oldPagination.totalPage = NaN;
		oldPagination.$pagingEnd = false;
		break;
	default: /* 不传命令表示刷新或自己控制 */
		if(pagination.page !== undefined) {
			oldPagination.page = pagination.page;
		}
		if(pagination.offset !== undefined) {
			oldPagination.offset = pagination.offset;
		}
		break;
	}
	if(oldPagination.ajaxParams) {
		Utils.copyProperties(oldPagination.ajaxParams, ajaxParams);
	}
	if(ajaxParams) {
		if(oldPagination.page) {
			ajaxParams.page = oldPagination.page;
		}
		if(oldPagination.count) {
			ajaxParams.count = oldPagination.count;
		}
		if(oldPagination.offset) {
			ajaxParams.offset = oldPagination.offset;
		}
	}
	Utils.copyProperties(oldPagination, pagination);
	_putInCacheMap(PAGINATION_CACHE_NAME, oldPagination, true);
	return true;
};

/**
 * 私有: 设置分页查询结果的总数
 * @param {Object} pagination 分页对象
 * @param {Number} total 查询到的中数量
 * @param {Object} callbacks 回调对象
 */
const _setPaginationTotal = (pagination, total, callbacks) => {
	let oldPagination = _getInCacheMap(PAGINATION_CACHE_NAME, pagination.id);
	if(! oldPagination) {
		throw new Error('无id为' + pagination.id + '分页环境!');
	}
	oldPagination.total = total;
	oldPagination.totalPage = Math.ceil(total / oldPagination.count);
	
	// 最后一页了, 进行处理
	let isLastPage = oldPagination.page >= oldPagination.totalPage;
	if(isLastPage) {
		oldPagination.$pagingEnd = true;
		oldPagination.loaded = oldPagination.count * (oldPagination.page - 1) + (total % oldPagination.count);
	} else {
		oldPagination.loaded = oldPagination.count * oldPagination.page;
	}
	oldPagination.left = total - oldPagination.loaded;
	Utils.copyProperties(oldPagination, pagination);
	_putInCacheMap(PAGINATION_CACHE_NAME, oldPagination, true);
	if(isLastPage && callbacks && Utils.isFunc(callbacks.onLastPage)) {
		callbacks.onLastPage(pagination);
	}
};

/**
 * 私有: (底层) 格式化Path
 * @param {String} path 从中获取对象时使用的Path
 */
const _formatPath = (path) => {
	return path;
};

/**
 * 私有: (底层) 根据Path获取对象
 * @param {Object} json 目标对象
 * @param {String} path 从中获取对象时使用的Path
 */
const _getObjByPath = (json, path) => {
	return JSONPath({path: _formatPath(path), json: json})[0];
};

/**
 * 私有: (底层) 获取请求结果中的对象
 * @param {Object} json 请求结果对象
 * @param {String} path 从中获取对象时使用的Key
 */
const _getObjFromJsonByKey = (json, path) => {
	if(_getObjByPath(json, path) !== undefined) {
		return _getObjByPath(json, path);
	}
	if((json.value && _getObjByPath(json.value, path)) !== undefined) {
		return _getObjByPath(json.value, path);
	}
	if((json.data && _getObjByPath(json.data, path)) !== undefined) {
		return _getObjByPath(json.data, path);
	}
};

/**
 * 私有: (底层) 获取请求结果中的对象
 * @param {Object} json 请求结果对象
 * @param {String | String List} paths 从中获取对象时使用的Path, 可以为列表
 * @param {Object} defaultVal 默认值
 */
const _getObjFromJson = (json, paths, defaultVal) => {
	if(! json || ! paths) {
		return;
	}
	if(! Utils.isObject(json)) {
		return defaultVal;
	}
	if(Utils.isString(paths)) {
		let result = _getObjFromJsonByKey(json, paths);
		if(result !== undefined) {
			return result;
		}
	}
	if(Utils.isArray(paths)) {
		for(let path of paths) {
			let result = _getObjFromJsonByKey(json, path);
			if(result) {
				return result;
			}
		}
	}
	return [json];
};

/**
 * 私有: 获取请求结果中的处理结果标志
 * @param {Object} json 请求结果对象
 * @param {String | String List} path 从中获取处理结果标志时使用的Path, 可以为列表
 */
const _getResultFromJson = (json, path = 'result') => {
	return _getObjFromJson(json, path, false);
};

/**
 * 私有: 获取请求结果中的数据集
 * @param {Object} json 请求结果对象
 * @param {String | String List} path 从中获取数据集时使用的Path, 可以为列表
 */
const _getRowsFromJson = (json, path = 'rows') => {
	return _getObjFromJson(json, path);
};

/**
 * 私有: 获取请求结果中的总数的值
 * @param {Object} json 请求结果对象
 * @param {String | String List} path 从中获取总数的值时使用的Path, 可以为列表
 */
const _getTotalFromJson = (json, path = 'total') => {
	return _getObjFromJson(json, path);
};

/**
 * 私有: 获取错误请求结果中的错误信息
 * @param {Object} json 请求结果对象
 * @param {String | String List} path 从中获取错误信息时使用的Path, 可以为列表
 */
const _getErrorMsgFromJson = (json, path = ['msg', 'message']) => {
	return _getObjFromJson(json, path);
};

/**
 * 私有: 获取错误请求结果中的错误类型
 * @param {Object} json 请求结果对象
 * @param {String | String List} path 从中获取错误类型时使用的Path, 可以为列表
 */
const _getErrorTypeFromJson = (json, path = 'errorType') => {
	return _getObjFromJson(json, path);
};

/**
 * 私有: 提交一个任务
 * @param {Object} task 任务
 * @param {Object} callbacks 回调对象
 */
const _postTask = (task, callbacks) => {
	let currentTime = new Date().getTime();
	let oldTask = _getInCacheMap(TASK_CACHE_NAME, task.id);
	if(oldTask) {
		// 过快
		if(currentTime - oldTask.startTime < Config.MIN_SAME_TASK_POST_INTERVEL) {
			if(Utils.isFunc(callbacks.onTooFast)) {
				callbacks.onTooFast(oldTask);
			}
			return false;
		}
		// 验证状态
		switch(oldTask.status) {
		case TASK_STATUS__DEFAULT: /* 未结束 */
			// 超时, 则重新开始, 即使可能出现重复数据提交
			if(currentTime - oldTask.startTime > Config.TIMEOUT_INTERVEL) {
				break;
			}
			if(Utils.isFunc(callbacks.onPostSame)) {
				callbacks.onPostSame(oldTask);
			}
			return false;
		case TASK_STATUS__DONE: /* 上一个该类任务已结束, 可以重新开始 */
		case TASK_STATUS__FAIL:
			task = oldTask;
			break;
		default:
			return false;
		}
		_removeInCacheMap(TASK_CACHE_NAME, oldTask.id);
	}
	// 重设任务
	task.status = TASK_STATUS__DEFAULT;
	task.startTime = currentTime;
	_putInCacheMap(TASK_CACHE_NAME, task);
	return true;
};

/**
 * 私有: 标记一个任务状态
 * @param {Object} task 任务
 * @param {String} status 任务状态
 */
const _markTaskStatus = (task, status) => {
	let currentTime = new Date().getTime();
	let oldTask = _getInCacheMap(TASK_CACHE_NAME, task.id);
	if(oldTask) {
		oldTask.status = status;
		oldTask.updateTime = currentTime;
		_putInCacheMap(TASK_CACHE_NAME, oldTask);
		return true;
	}
	return false;
};
