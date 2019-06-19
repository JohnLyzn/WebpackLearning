import {DefaultValidators} from 'common/constants';

/**
 * 常用的工具方法(从旧的拷贝过来的, 需要新的以后改)
 */
const Utils = {
	/**
	* 验证
	*/
	validate: function(val, rulesMap) {
		if(! rulesMap) {
			return;
		}
		for(var name in rulesMap) {
			if(rulesMap.hasOwnProperty(name)) {
				var rules = rulesMap[name];
				if(! Utils.isObject(rules)) {
					throw new Error('不正确的规则对象: ' + rules);
				}
				var validator = DefaultValidators[name];
				if(! validator) {
					if(! Utils.isObject(rules.validator)) {
						throw new Error('非默认规则池的规则中不能没有指定validator: ' + rules);
					}
					validator = rules.validator;
					rules = rules.rules;
				}
				if(! rules) {
					continue;
				}
				if(! (rules instanceof Array)) {
					rules = [rules];
				}
				for(var i = 0; i < rules.length; i ++) {
					var rule = rules[i];
					if(! rule.hasOwnProperty('fail')) {
						rule.fail = false;
					}
					if(Utils.isFunc(rule.always)) {
						rule.always();
					}
					if(rule.fail === validator.validate(val, rule)) {
						return rule.fail;
					}
				}
			}
		}
		return true;
	},
	/**
	* 检查一个变量是否有效
	* @param {Object} variable 检查的变量
	*/
	isValidVariable: function(variable){
		if(variable === null || variable === undefined 
			|| variable === '' || variable === 'undefined'
			|| variable === 'null') {
			return false;
		}
		return true;
	},
	/**
	* 判断某个对象是否是函数
	*/
	isFunc: function(func) {
		if(typeof func == 'function') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是对象
	*/
	isObject: function(obj) {
		if(obj instanceof Object || typeof obj == 'object') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是数组
	*/
	isArray: function(arr) {
		if(arr instanceof Array || (arr && arr.constructor.toString().indexOf('function Array() {') != -1)) {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是字符串
	*/
	isString: function(str) {
		if(str instanceof String || typeof str == 'string') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否数字
	*/
	isNumber: function(number) {
		if(number instanceof Number || typeof str == 'number') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是指定类型实例
	*/
	isInstance: function(obj, type) {
		if(obj instanceof type || (obj && type && obj.constructor.toString() == type.toString())) {
			return true;
		}
		return false;
	},
	/**
	* 复制属性
	*/
	copyProperties: function(from, to) {
		if(! from || ! to) {
			return;
		}
		if(typeof from != 'object') {
			throw new Error('复制的目标必须为对象({...}或[...])');
		}
		if(typeof to != 'object') {
			throw new Error('复制的结果必须为对象({...}或[...])');
		}
		for(var property in from) {
			if(! from.hasOwnProperty(property)) {
				continue;
			}
			var formVal = from[property];
			if((to[property] !== undefined && formVal === undefined)
					|| (to[property] !== null && formVal === null)) {
				continue;
			}
			if(formVal && typeof formVal == 'object') {
				var copyObj = null;
				if(formVal instanceof Array) {
					copyObj = [];
				} else {
					copyObj = {};
				}
				Utils.copyProperties(formVal, copyObj);
				to[property] = copyObj;
				continue;
			}
			to[property] = formVal;
		}
	},
	/**
	* 把List转换为Map
	* @param {Array} list List
	* @param {String} key Map的key的值对应在List中对象的属性名称
	* @return {Object} Map
	*/
	asMap: function(list, key, filter) {
		if(! list || ! key) {
			return;
		}
		var result = {};
		for(var i = 0; i < list.length; i ++) {
			var element = list[i];
			if(Utils.isFunc(filter) && ! filter(element)) {
				continue;
			}
			var elementKey = element[key];
			if(Utils.isFunc(key)) {
				elementKey = element[key(element)];
			}
			if(! Utils.isObject(element) || ! elementKey) {
				continue;
			}
			var existElement = result[elementKey];
			if(! existElement) {
				result[elementKey] = element;
				continue;
			}
			if(! Utils.isArray(existElement)) {
				existElement = [existElement];
				result[elementKey] = existElement;
			}
			existElement.push(element);
		}
		return result;
	},
	/**
	* 把Map转换为List
	* @param {Object} map Map
	* @return {Array} List
	*/
	asList: function(map, filter) {
		if(! map) {
			return;
		}
		var result = [];
		for(var key in map) {
			if(map.hasOwnProperty(key)) {
				var val = map[key];
				if(val) {
					if(Utils.isFunc(filter) && ! filter(key, val)) {
						continue;
					}
					result.push(val);
				}
			}
		}
		return result;
	},
	/**
	* 把Map的Key转换为List
	* @param {Object} map Map
	* @return {Array} List
	*/
	asKeyList: function(map, filter) {
		if(! map) {
			return;
		}
		var result = [];
		for(var key in map) {
			if(map.hasOwnProperty(key)) {
				if(Utils.isFunc(filter) && ! filter(key, map[key])) {
					continue;
				}
				result.push(key);
			}
		}
		return result;
	},
	/**
	* 把Map转换为List
	* @param {Object} map Map
	* @param {String} key 指定的Map的key, 对应的值组成List
	* @return {Array} List
	*/
	asListByKey: function(mapOrList, key) {
		if(! mapOrList || ! key) {
			return;
		}
		var result = [];
		for(var key1 in mapOrList) {
			if(mapOrList.hasOwnProperty(key1)) {
				var element = mapOrList[key1];
				var resultElement = element[key];
				if(Utils.isFunc(key)) {
					resultElement = element[key(element)];
				}
				result.push(resultElement);
			}
		}
		return result;
	},
	/**
	* 把第二个List中不在第一个List的元素添加到第一个List的结尾, 并且去掉重复的部分
	* @param {Array} list1 数组1
	* @param {Array} list2 数组2
	*/
	combindListWithoutRepeat: function(list1, list2) {
		if(! Utils.isArray(list1) || ! Utils.isArray(list2)) {
			throw new Error('合并的必须是数组');
		}
		for(var i = 0; i < list2.length; i ++) {
			var val = list2[i];
			if(val === undefined && val === null) {
				continue;
			}
			if(list1.indexOf(val) == -1 || list1.indexOf(val.toString()) == -1) {
				list1.push(val);
			}
		}
	},
	/**
	* 判断对象是否具备某些key
	* @param {Object} map 需要进行判断的目标对象
	* @param {String | String Array} keys 对象属性名称
	* @param {Boolean} isAny 是否是有一个出现就返回true
	* @return {Boolean} 是否所有指定的key
	*/
	hasKeys: function(map, keys, isAny) {
		if(! map || ! keys) {
			return false;
		}
		if(Utils.isString(keys)) {
			keys = [keys];
		}
		var result = true;
		for(var i = 0; i < keys.length; i ++) {
			var key = keys[i];
			var has = map.hasOwnProperty(key);
			if(! has && ! isAny) {
				result = false;
				break;
			} else if(has && isAny) {
				break;
			}
		}
		return result;
	},
	/**
	* 对类数组对象进行遍历操作
	* @param {Array Like} obj 需要进行判断的目标节点
	* @param {Function} callback 事件名称
	*/
	forEach: function(obj, callback) {
		if(! obj || ! Utils.isFunc(callback)) {
			return;
		}
		if(Utils.isFunc(obj.forEach)) {
			obj.forEach(callback);
			return;
		}
		if(Utils.isArray(obj)) {
			for(var i = 0; i < obj.length; i ++) {
				const element = obj[i];
				callback(element, i, obj);
			}
			return;
		}
		for(var key in obj) {
			if(! obj.hasOwnProperty(key)) {
				continue;
			}
			const element = obj[key];
			callback(element, key, obj);
		}
	},
	/**
	* 判断节点是否具备事件
	* @param {DOMNode} node 需要进行判断的目标节点
	* @param {String} eventName 事件名称
	* @return {Boolean} 是否具备该事件
	*/
	hasEvent: function(node, eventName) {
		return false;
	},
	/**
	* 触发事件
	* @param {String} eventName 事件名称
	*/
	triggerEvent: function(dom, eventName) {
		if(Utils.isFunc(dom.fireEvent)) {
			if(! eventName.startsWith('on')) {
				eventName = 'on' + eventName;
			}
			dom.fireEvent(eventName.toLowerCase());
			return;
		}
		const event = document.createEvent('HTMLEvents');
		event.initEvent(eventName, false, true);
		dom.dispatchEvent(event);
	},
	/**
	* 停止事件冒泡
	* @param {Event Object} event 事件
	*/
	stopBubble: function(event) {
		event = event || window.event;
		event.cancelBubble && (event.cancelBubble = true);
		event.stopPropagation && event.stopPropagation();
		event.returnValue && (event.returnValue = false);
		event.preventDefault && event.preventDefault();
	},
	/**
	* 把格式字符串中的占位符替换指定上下文中指定名称的值
	* @param {String} format 格式字符串, 如{xxx}
	* @param {Object} context 某个上下文, 包含替换的名称对应的属性和值
	* @return {Boolean} 是否具备该事件
	*/
	replacePlaceHolder: function(format, context) {
		if(! Utils.isString(format)) {
			return '';
		}
		var isSingleVal = ! Utils.isObject(context);
		var matches = null, lastFormat = null;
		while((matches = format.match(/{.*?}/)) && matches.length > 0) {
			for(var i = 0; i < matches.length; i ++) {
				var match = matches[i];
				var val = (isSingleVal ? context : context[match.replace(/{|}/g, '')]) || '';
				format = format.replace(new RegExp(match, 'g'), val);
			}
			if(lastFormat == format) {
				break;
			}
			lastFormat = format;
		}
		return format;
	},
	/**
	* 截取数组中的元素作为新的数组
	* @param {String} format 格式字符串, 如{xxx}
	* @param {Object} context 某个上下文, 包含替换的名称对应的属性和值
	* @return {Boolean} 是否具备该事件
	*/
	sliceArrayLike: function(arrayLike, start, end) {
		if(! arrayLike) {
			return [];
		}
		if(! Utils.isArray(arrayLike)) {
			arrayLike = Utils.asList(arrayLike);
		}
		return arrayLike.slice(start, end);
	},
	/**
	* 生成一个临时ID
	* @return {String} 临时ID
	*/
	generateTemporyId: function() {
		var s = [];
		var hexDigits = "0123456789abcdef";
		for (var i = 0; i < 36; i++) {
			s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
		}
		s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
		s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
		s[8] = s[13] = s[18] = s[23] = "-";
	
		return s.join("");
	},
	/**
	 * 转换为查询参数字符串
	 */
	toQueryStr: function(obj) {
		if(! Utils.isValidVariable(obj)) {
			return '';
		}
		if(Utils.isString(obj)) {
			return obj;
		}
		if(Utils.isObject(obj)) {
			let queryStr = '';
			for(let key of obj) {
				queryStr += '&' + obj[key];
			}
			return queryStr.substr(1, queryStr.length);
		}
		return '';
	},
};

export default Utils;