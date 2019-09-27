/* ! 环境配置, 把和上下文有关的所有公共方法或变量提取到这里 */

/* 环境变量方法 */
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

/* 数据处理基础方法 */
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

import Utils from 'common/utils';

/**
 * 处理包括文件的远程Ajax请求参数
 * @param {Object} option 远程请求参数
 */
const formatPOSTAjaxParams = (option) => {
	if(! option.data) {
		return;
	}
	const ajaxParams = option.data;
	const headers = option.headers = option.headers || {};
	const formData = new FormData();
	for(let key in ajaxParams) {
		if(! ajaxParams.hasOwnProperty(key)) {
			continue;
		}
		if(Utils.isInstance(ajaxParams[key], File)) {
			headers['Content-Type'] = 'multipart/form-data';
		}
		formData.append(key, ajaxParams[key]);
	}
	if(headers['Content-Type'] != 'multipart/form-data') {
		headers['Content-Type'] = 'application/x-www-form-urlencoded'
		return qs.stringify(ajaxParams);
	}
	return formData;
};

import axios from 'axios';
import qs from 'qs';

/**
 * 远程Ajax请求
 * @param {Object} option 远程请求参数
 */
export const ajax = async (option) => {
	let response;
	if(option.type && option.type.toUpperCase() == 'POST') {
		let data = formatPOSTAjaxParams(option);
		response = await axios.post(option.url, data, {
			headers: option.headers,
		}).catch(err => {
			if (typeof option.error == 'function') {
				option.error(err);
			}
		});
	} else {
		response = await axios.request({
			url: option.url,
			params: option.data,
			method: option.type,
			headers: option.headers,
			paramsSerializer: (params) => {
				return qs.stringify(params, { arrayFormat: 'brackets' });
			}
		}).catch(err => {
			if (typeof option.error == 'function') {
				option.error(err);
			}
		});
	}
	if(! response) {
		return;
	}
	return response.data;
};

/* 日志的工具方法 */
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
import 'muse-ui-message/dist/muse-ui-message.css';
import Vue from 'vue';
import Message from 'muse-ui-message';
import Toast from 'muse-ui-toast';
Vue.use(Toast, {
	position: 'top',               // 弹出的位置
	time: 2000,                       // 显示的时长
	closeIcon: ':iconfont iconclose',               // 关闭的图标
	close: true,                      // 是否显示关闭按钮
	successIcon: ':iconfont iconsuccess',      // 成功信息图标
	infoIcon: ':iconfont iconinfo',                 // 信息信息图标
	warningIcon: ':iconfont iconwarn',     // 提醒信息图标
	errorIcon: ':iconfont iconerror'              // 错误信息图标
});
Vue.use(Message);

/**
 * 提示信息(主要)
 */
export const toast = (message, type = 'message', options) => {
	Toast[type](Object.assign({
		message: message,
	}, options));
};

/**
 * 通知信息(次要)
 */
export const notify = (message, type = 'info', options) => {
	Toast[type](Object.assign({
		message: message,
	}, options));
};

/**
 * 弹出提示框
 */
export const alert = (message, title, callback, options) => {
	Message(Object.assign({
		mode: 'alert', 
		title: title, 
		content: message,
	}, options)).then(callback);
};

/**
 * 弹出多个确认的提示框
 */
export const confirm = (message, title, callback, options) => {
	Message(Object.assign({
		mode: 'confirm', 
		title: title, 
		content: message,
	}, options)).then(callback);
};

/**
 * 弹出输入内容的提示框
 */
export const prompt = (message, title, callback, options) => {
	Message(Object.assign({
		mode: 'prompt', 
		title: title, 
		content: message,
	}, options)).then(callback);
};

/**
 * 清除提示框
 */
export const clearDialog = () => {
};

/* 数据基础组件及其初始化 */
import CacheManager from 'common/cache_manager';
const cacheManager = new CacheManager();

/**
 * 获取缓存管理器
 */
export const getCacheManager = () => {
	return cacheManager;
};

import BaseService from 'service/base_service';
const baseService = new BaseService();

/**
 * 私有: 远程请求获取基础信息
 */
const fetchConfigs = async () => {
	return await baseService.queryTemplate(null, null, {
		ajaxParams: {
			action: 'getConfigs',
		},
		singleResult: true,
		errorTag: 'getConfigs',
		errorMsg: '获取基本信息失败',
	});
};

/**
 * 获取一些基础信息
 */
const CACHE_KEY_CONFIGS = 'DMT#COFNIGS';
export const getConfigs = async () => {
	const cacheManager = getCacheManager();
	const config = cacheManager.get(CACHE_KEY_CONFIGS);
	if (config) {
		return config;
	}
	const fetchConfig = await fetchConfigs();
	if (!fetchConfig) {
		throw new Error('获取工具配置信息失败');
	}
	cacheManager.cache(CACHE_KEY_CONFIGS, fetchConfig);
	return fetchConfig;
};
/* 界面处理 */
/**
 * 获取DOM元素的Style
 */
export const getElementComputedStyle = (el, attr) => {
	if(! el) {
		return null;
	}
	let style;
	if(el.currentStyle) {
		style = el.currentStyle[attr];
	} else {
		style = getComputedStyle(el, false)[attr];
	}
	if(style.indexOf('px') != -1) {
		return parseInt(style.match(/\d+/)[0]);
	}
	return style;
};

/**
 * 获取DOM元素的盒子信息
 */
export const getElementRect = (el) => {
	if(! el) {
		return null;
	}
	if(el === window || el === document) {
		return {
			top: 0,
			bottom: window.innerHeight,
			left: 0,
			right: window.innerWidth,
		};
	}
	if(! el.getClientRects) {
		return null;
	}
	return el.getClientRects()[0];
};

/**
 * 处理是否有上一页
 */
export const hasLastPage = (navigator, history) => {
	// 尝试回退到上一页
	if (navigator.userAgent.indexOf('MSIE') != -1 &&
		navigator.userAgent.indexOf('Opera') == -1) {
		// IE      
		if (history.length > 0) {
			return true;
		}
	}
	if (navigator.userAgent.indexOf('Firefox') != -1 ||
		navigator.userAgent.indexOf('Opera') != -1 ||
		navigator.userAgent.indexOf('Safari') != -1 ||
		navigator.userAgent.indexOf('Chrome') != -1 ||
		navigator.userAgent.indexOf('WebKit') != -1) {
		//非IE浏览器
		if (history.length > 1) {
			return true;
		}
	}
	return history.length > 0;
}

/**
 * 处理浏览器返回
 */
export const pageBack = () => {
	if(hasLastPage(window.navigator, window.history)) {
		window.history.go(-1);
		return;
	}
	// 向iframe外部发送需要关闭iframe的消息(如果是)
	notifyParentFrame('pageclose');
	// 如果没有上一页, 则关闭标签页
	if(g_clientType < 200) {
		window.close();
		return;
	}
	// 如果是APP调用api
	require('plugin/API').quitToolPageAPI();
}

/**
 * 向父级Frame发送消息
 */
export const notifyParentFrame = (data) => {
	if(window.parent && window.parent.postMessage) {
		window.parent.postMessage(data, '*');
	}
};

/**
 * 生成默认的全局的二维码DOM
 */
const genterateDefaultQrCodeDom = () => {
	const dom = document.querySelector('.qrcode-fixed-container>.qrcode');
	if(dom) {
		dom.parentElement.style.display = 'flex';
		if(dom.querySelector('img')) {
			dom.removeChild(dom.querySelector('img'));
		}
		if(dom.querySelector('canvas')) {
			dom.removeChild(dom.querySelector('canvas'));
		}
		return dom;
	}
	// 容器
	const containerDom = document.createElement('div');
	const classAttr1 = document.createAttribute('class');
	classAttr1.value = 'qrcode-fixed-container';
	containerDom.setAttributeNode(classAttr1);
	// 二维码
	const qrCodeDom = document.createElement('div');
	const classAttr2 = document.createAttribute('class');
	classAttr2.value = 'qrcode';
	qrCodeDom.setAttributeNode(classAttr2);
	containerDom.appendChild(qrCodeDom);
	// 关闭按钮
	const closeBtnDom = document.createElement('div');
	const classAttr3 = document.createAttribute('class');
	classAttr3.value = 'closebtn';
	closeBtnDom.setAttributeNode(classAttr3);
	qrCodeDom.appendChild(closeBtnDom);
	// 关闭事件
	closeBtnDom.addEventListener('click', () => {
		containerDom.style.display = 'none';
	});
	// 追加到body下
	document.querySelector('body').appendChild(containerDom);
	return qrCodeDom;
}

/**
 * 生成微信分享请求URL
 */
const generateShareWxUrl = (params) => {
	if(! window.g_wxUrl) {
		return 'https://wx.wetoband.com/gotoShare?' + Utils.toQueryStr(params);
	}
	return window.g_wxUrl + '/gotoShare?' + Utils.toQueryStr(params);
};

/**
 * 处理分享到微信
 */
export const shareToWx = (config) => {
	if(g_clientType < 200) { /* PC */
		if(! config.dom) {
			config.dom = genterateDefaultQrCodeDom();
		}
		const QRCode = require('qrcodejs2');
		new QRCode(config.dom, {
			text: generateShareWxUrl({
				shareType: 'href',
				url: encodeURIComponent(config.url),
				title: config.title,
				desc: config.content,
			}),
			width: config.width || 170,
			height: config.height || 170,
			colorDark: config.color || '#333333', //二维码颜色
			colorLight: config.bgColor || '#ffffff', //二维码背景色
			correctLevel: QRCode.CorrectLevel.L //容错率，L/M/H
		});
		return;
	}
	if(g_clientType < 300) { /* APP */
		require('plugin/API').callAppAPI('shareToWX', {
			url: config.url,
			tiltle: config.title,
			content: config.content,
		});
		return;
	}
	/* wx */
	window.open(generateWxUrl({
		shareType: 'href',
		url: encodeURIComponent(config.url),
		title: config.title,
		desc: config.content,
	}));
}