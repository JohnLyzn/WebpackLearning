
const Utils = {
    /**
	 * 检查一个变量是否有效并且不为空
	 * @param {Object} variable 检查的变量
	 * @return {Boolean} 是否有效并且不为空
	 */
	isEmpty: function(variable) {
		if(! Utils.isValidVariable(variable)) {
			return true;
		}
		if(Utils.isArray(variable)
			&& variable.length < 1) {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是函数
	* @param {Object} func 检查的对象
	* @return {Boolean} 是否是函数
	*/
	isFunc: function(func) {
		if(typeof func == 'function') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是对象
	* @param {Object} obj 检查的对象
	* @return {Boolean} 是否是对象
	*/
	isObject: function(obj) {
		if(obj instanceof Object || typeof obj == 'object') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是数组
	* @param {Object} arr 检查的对象
	* @return {Boolean} 是否是数组
	*/
	isArray: function(arr) {
		if(arr instanceof Array || (arr && arr.constructor.toString().indexOf('function Array() {') != -1)) {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是字符串
	* @param {Object} str 检查的对象
	* @return {Boolean} 是否是字符串
	*/
	isString: function(str) {
		if(str instanceof String || typeof str == 'string') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否数字
	* @param {Object} number 检查的对象
	* @return {Boolean} 是否是数字
	*/
	isNumber: function(number) {
		if(number instanceof Number || typeof number == 'number') {
			return true;
		}
		return false;
	},
	/**
	* 判断某个对象是否是指定类型实例
	* @param {Object} obj 检查的对象
	* @param {Object} type 指定类型实例
	* @return {Boolean} 对象是否是指定类型实例
	*/
	isInstance: function(obj, type) {
		if(obj instanceof type || (obj && type && obj.constructor.toString() == type.toString())) {
			return true;
		}
		return false;
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
};

const LISTENING_ELS = [];
const BACK_OBJS = {};
const GLOBAL_STATES = {
    backObjIdGrowth: Date.now(),
    lastEventTime: 0,
    eventMinIntervalMils: 500,
    topUrl: '',
};

const VBACK_EVENT_GLB_LISTERNER = (e) => {
    // 有效间隔内方可触发
    if(! _isValidEventInterval(e)) {
        return;   
    }
    // 进行vback事件处理
    const matched = GLOBAL_STATES.topUrl.match(/#vback.*$/);
    if(! matched || ! matched.length) {
        return;
    }
    Utils.stopBubble(e);
    const backObj = BACK_OBJS[matched[0].replace(/#vback/g, '')];
    if(! backObj) {
        return;
    }
    actPopState(backObj.$el, backObj);
};

const _isValidEventInterval = (e) => {
    if(! e.timeStamp) {
        return false;
    }
    const interval = e.timeStamp - GLOBAL_STATES.lastEventTime;
    if(interval < GLOBAL_STATES.eventMinIntervalMils) {
        if(interval < 10) {
            window.history.forward();
        }
        return false;
    }
    GLOBAL_STATES.lastEventTime = e.timeStamp;
    return true;
};

const _keyOf = (key) => {
    const paths = key.split('.');
    return paths[paths.length - 1];
};

const _parentOfKey = (root, key) => {
    const paths = key.split('.');
    if(paths.length == 1) {
        return root;
    }
    let parent = root;
    for(let i = 0; i < paths.length - 1; i ++) {
        parent = parent[paths[i]];
        if(parent === undefined) {
            return root;
        }
    }
    return parent;
};

const _containsKey = (root, key) => {
    const parent = _parentOfKey(root, key);
    const argKey = _keyOf(key);
    return parent.hasOwnProperty && parent.hasOwnProperty(argKey);
};

const _nextTick = (func, waitMils) => {
    setTimeout(func, waitMils || 0);
};

const _init = (el) => {
    el.VBACK_EVENT_QUEUE = [];
    el.VBACK_EVENT_KEYS = [];
    el.VBACK_EVENT_STATES = {
        lastTime: 0,
        canceling: false,
        poping: false,
    };
};

const _analysisArgs = (element, index) => {
    // 返回值为initBackObj方法形参el后面的参数, 顺序一致
    const canBeRoot = index == 0;
    if(Utils.isFunc(element)) {
        if(canBeRoot) {
            return [true, '$', null, element];
        }
        throw new Error('v-back指令第' + (index + 1) + '位参数未指定监听目标，请通过{watch:"xxx",in:func,out:func}的方式指定监听目标以及回调函数');
    }
    if(Utils.isObject(element)) {
        return [false, element.watch, element.in, element.out];
    }
    if(Utils.isString(element)) {
        return [false, element];
    }
};

const _getBackObj = (el, key) => {
    const index = el.VBACK_EVENT_KEYS.indexOf(key);
    if(index == -1) {
        return;
    }
    return el.VBACK_EVENT_QUEUE[index];
};
const _generateBackObjId = () => {
    return ++ GLOBAL_STATES.backObjIdGrowth;
};

const initBackObj = (el, isRoot, key, inFn, outFn) => {
    if(! key) {
        return;
    }
    const oldObj = _getBackObj(el, key)
    if(oldObj) {
        return oldObj;
    }
    const newObj = {
        id: _generateBackObjId(),
        key: key,
        handleIn: inFn,
        handleOut: outFn,
        $root: isRoot,
        $el: el,
        $context: '',
        $watched: false,
        $statePushed: false,
        $statePoped: false,
        $stateCancel: false,
    };
    el.VBACK_EVENT_KEYS.push(key);
    el.VBACK_EVENT_QUEUE.push(newObj);
    BACK_OBJS[newObj.id] = newObj;
    return newObj;
};

const _syncTopUrl = () => {
    GLOBAL_STATES.topUrl = document.URL;
};

const initWatchers = (el, context) => {
    if(! el.VBACK_EVENT_QUEUE
        || ! context) {
        return;
    }
    for(let backObj of el.VBACK_EVENT_QUEUE) {
        backObj.$context = context;
        if(backObj.$watched) {
            continue;
        }
        // 如果为根返回事件对象, 初始化时为它设置一次PushStateTrick
        if(backObj.$root) {
            console.log('v-back根事件被指定');
            actPushState(el, backObj);
            backObj.$watched = true;
            continue;
        }
        if(! _containsKey(context, backObj.key)) {
            console.warn('v-back监听目标[' + backObj.key + ']不存在！');
            continue;
        }
        context.$watch(backObj.key, (newVal) => {
            if(newVal) {
                actPushState(el, backObj);
                return;
            }
            cancelPushStateTrick(el, backObj);
        });
        console.log('v-back开始监听' + backObj.key);
        backObj.$watched = true;
        // 如果本来就是true就直接设置空历史记录
        const parent = _parentOfKey(context, backObj.key);
        const argKey = _keyOf(backObj.key);
        if(parent[argKey]) {
            actPushState(el, backObj);
        }
    }
};

const actPushState = (el, backObj) => {
    if(! backObj
        || ! backObj.$context
        || ! backObj.$watched
        || backObj.$statePushed) {
        return;
    }
    console.log('v-back为' + backObj.key + '压入空历史记录等待返回事件触发, 目前history长度为' + window.history.length);
    // 数据中包括vback标记, 后拼接上backObj的id
    if(document.URL.indexOf('#vback') == -1) {
        window.history.pushState({vback:backObj.id}, null, document.URL +'#vback' + backObj.id); 
    } else {
        window.history.pushState({vback:backObj.id}, null, document.URL.replace(/#vback.*$/, '#vback'+ backObj.id));
    }
    _syncTopUrl(); /* 这时已经是vback后缀 */
    backObj.$statePoped = false;
    backObj.$statePushed = true;
    backObj.$stateCancel = false;
    if(Utils.isFunc(backObj.handleIn)) {
        console.log('v-back初始化事件, 调用in回调, 目前history长度为' + window.history.length);
        _nextTick(() => {
            backObj.handleIn.call(backObj.$context);
        });
    }
};

const actPopState = (el, backObj) => {
    backObj.$stateCancel && window.history.back(); /* 已取消直接退历史 */
    _syncTopUrl(); /* 即使已经处理过也要先同步历史地址 */
    if(! backObj
        || ! backObj.$context
        || ! backObj.$watched
        || ! backObj.$statePushed
        || backObj.$statePoped) {
        return;
    }
    backObj.$statePushed = false;
    backObj.$statePoped = true;
    if(Utils.isFunc(backObj.handleOut)) {
        console.log('v-back返回事件被触发, 为' + backObj.key + '调用out回调, 目前history长度为' + window.history.length);
        _nextTick(() => {
            backObj.handleOut.call(backObj.$context);
        });
        return true;
    }
    console.log('v-back返回事件被触发, 设置' + backObj.key + '值为false, 目前history长度为' + window.history.length);
    const parent = _parentOfKey(backObj.$context, backObj.key);
    const argKey = _keyOf(backObj.key);
    backObj.$context.$set(parent, argKey, false);
};

const cancelPushStateTrick = (el, backObj) => {
    _syncTopUrl(); /* 依然需要同步当前地址 */
    if(el.VBACK_EVENT_STATES.poping
        || el.VBACK_EVENT_STATES.canceling
        || backObj.$root
        || ! backObj.$statePushed) {
        return;
    }
    console.log('v-back为' + backObj.key + '取消空历史记录, 目前history长度为' + window.history.length);
    backObj.$statePushed = false;
    backObj.$statePoped = false;
    backObj.$stateCancel = true;
    /* 这里不退历史, 因为可能执行到这里时顺序是乱的, 可能退错, 
     仅标记为取消交给popstate监听到再多次退历史(它的顺序是对的) */
};

const bindPopStateEventListener = (el) => {
    if(LISTENING_ELS.indexOf(el) != -1) {
        return;
    }
    LISTENING_ELS.push(el);
    console.log('v-back初始化监听popstate作为返回事件处理, 目前history长度为' + window.history.length);
    _nextTick(() => {
        /* 同名函数添加监听不会重复 */
        if (window.addEventListener) { //所有主流浏览器，除了 IE 8 及更早 IE版本
            window.addEventListener('popstate', VBACK_EVENT_GLB_LISTERNER, false); 
            // window.addEventListener('beforeunload', VBACK_EVENT_GLB_LISTERNER, false); 
        } else if (window.attachEvent) { // IE 8 及更早 IE 版本
            window.attachEvent('onpopstate', VBACK_EVENT_GLB_LISTERNER, false);
            // window.attachEvent('beforeunload', VBACK_EVENT_GLB_LISTERNER, false);
        }
    });
};

const unbindPopStateEventListener = (el) => {
    if(LISTENING_ELS.indexOf(el) == -1) {
        return;
    }
    LISTENING_ELS.splice(LISTENING_ELS.indexOf(el), 1);
};

const VueBack = {
    install: function(Vue, options) {
        Vue.directive('back', {
            bind: function (el, binding, vnode) {
                if(! Utils.isArray(binding.value)) {
                    throw new Error('v-back指令参数为需要监听的页面开关标志参数数组！');
                }
                _init(el);
                for(let i = 0; i < binding.value.length; i ++) {
                    const element = binding.value[i];
                    const translated = _analysisArgs(element, i);
                    if(! translated) {
                        throw new Error('v-back指令参数' + JSON.stringify(element) + '格式无效！');
                    }
                    initBackObj(el, ...translated);
                }
                bindPopStateEventListener(el);
                _nextTick(() => {
                    initWatchers(el, vnode.context);
                });
            },
            unbind: function(el, binding, vnode) {
                _nextTick(() => {
                    unbindPopStateEventListener(el);
                });
            },
        });
    },
};
export default VueBack;