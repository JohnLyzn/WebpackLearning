/* 环境配置, 把和上下文有关的所有公共方法或变量提取到这里 */
/**
 * 获取项目请求根路径
 */
export const getBaseUrl = () => {
	return g_runToolUrl;
};

/**
 * 获取项目资源请求根路径
 */
export const getResourceUrl = () => {
	return g_resourceUrl;
};

/**
 * 获取工具运行参数
 */
export const getRunToolParam = () => {
	return g_rtParam;
};

/**
 * 获取当前用户的AccessToken
 */
export const getAccessToken = () => {
	return g_accessToken;
};

/**
 * 获取当前的客户端类型
 */
export const getClientType = () => {
	return g_clientType;
};

import fuzzysort from 'plugin/fuzzysort';

/**
 * 根据对象某个key查询获取指定数据集合中符合条件的数据
 * @param {Array} objs 查询的数据集合
 * @param {String} searchKey 查询的数据中字段名称
 * @param {Number|String} searchValue 查询的值或其片段
 * @param {Boolean} strict 是否是严格模式, true表示必须值完全一致才能作为结果, false表示包含值才能作为结果, 不填表示完全模糊匹配
 * @return {Object List} 符合条件的数据列表, 如果找不到返回空列表
 */
export const search = (objs, searchKey, searchValue, strict) => {
	if (typeof objs != 'object') {
		throw new Error('非对象列表无法搜索');
	}
	if (!searchKey || !searchValue) {
		return [];
	}
	var option = {
		key: searchKey,
		allowTypo: false,
		threshold: -999,
	};
	var searchResults = fuzzysort.go(searchValue, objs, option);
	var results = [];
	for (var i = 0; i < searchResults.length; i++) {
		var searchResult = searchResults[i].obj;
		var objValue = searchResult[searchKey];
		if (strict === true && objValue == searchValue) {
			results.push(searchResult);
		} else if (strict === false && objValue.toString().indexOf(searchValue) != -1) {
			results.push(searchResult);
		} else if (strict === undefined) {
			results.push(searchResult);
		}
	}
	return results;
};

import Vue from 'vue';
import VueResource from 'vue-resource';

Vue.use(VueResource);

/**
 * 远程Ajax请求
 * @param {Object} option 远程请求参数
 */
export const ajax = async (option) => {
	let response = await Vue.http({
		url: option.url,
		params: option.data,
		method: option.type,
	}).catch(err => {
		if (typeof option.error == 'function') {
			option.error(err);
		}
	});
	if(! response) {
		return;
	}
	return response.body;
};

/**
 * 输出调试日志
 * @param {Object} msg 信息
 */
export const log = (msg) => {
	console.log(msg);
};
/**
 * 输出信息日志
 * @param {String} msg 信息
 */
export const info = (msg) => {
	console.info(msg);
};
/**
 * 输出警告日志
 * @param {String} msg 警告的消息
 */
export const warn = (msg) => {
	console.warn(msg);
};
/**
 * 输出错误日志
 * @param {String} msg 错误消息
 */
export const error = (msg) => {
	console.error(msg);
};

/* 提示用的工具方法 */
/**
 * 提示信息(主要)
 */
export const toast = (message, type = 'bottom', duration = 2000) => {
	require('mint-ui').Toast({
		message: message,
		position: type,
		duration: duration ,
	});
};

/**
 * 通知信息(次要)
 */
export const notify = (message, type = 'info', duration = 2000) => {
	require('mint-ui').Toast({
		message: message,
		position: type,
		duration: duration ,
	});
};

/**
 * 弹出提示框
 */
export const alert = (message, title, callback) => {
	require('mint-ui').MessageBox.alert(message, title).then(callback);
};

/**
 * 弹出多个确认的提示框
 */
export const confirm = (message, title, callback) => {
	require('mint-ui').MessageBox.confirm(message).then(callback, callback);
};

/**
 * 弹出输入内容的提示框
 */
export const prompt = (message, title, callback) => {
	require('mint-ui').MessageBox.prompt(message).then(callback);
};

/**
 * 清除提示框
 */
export const clearDialog = () => {
	require('mint-ui').MessageBox.close();
};

import CacheManager from 'common/cache_manager';

const cacheManager = new CacheManager();

/**
 * 获取缓存管理器
 */
export const getCacheManager = () => {
	return cacheManager;
};

// import BaseService from 'service/base_service';

// const baseService = new BaseService();

// /**
//  * 私有: 远程请求获取基础信息
//  */
// const fetchConfigs = async () => {
// 	return await baseService.queryTemplate({}, {}, {
// 		ajaxParams: {
// 			action: 'getConfigs',
// 		},
// 		singleResult: true,
// 		errorTag: 'getConfigs',
// 		errorMsg: '获取基本信息失败',
// 	});
// };

// /**
//  * 获取一些基础信息
//  */
// const CACHE_KEY_CONFIGS = 'DMT#COFNIGS';
// export const getConfigs = async () => {
// 	const cacheManager = getCacheManager();
// 	const config = cacheManager.get(CACHE_KEY_CONFIGS);
// 	if (config) {
// 		return config;
// 	}
// 	const fetchConfig = await fetchConfigs();
// 	if (!fetchConfig) {
// 		throw new Error('获取工具配置信息失败');
// 	}
// 	cacheManager.cache(CACHE_KEY_CONFIGS, fetchConfig);
// 	return fetchConfig;
// };