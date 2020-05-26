
import Utils from 'common/utils';

const LISTENING_ELS = [];
const GLOBAL_STATES = {
    actived: false,
    lastEventTime: 0,
    eventMinIntervalMils: 500,
    triggerRealBackTimer: '',
    triggerRealBackWaitMils: 500,
    cleaningUrl: '',
    cleaning: false,
    cleanDoneWaitTimer: '',
    cleanDoneWaitMils: 500,
};

const VBACK_EVENT_GLB_LISTERNER = (e) => {
    Utils.stopBubble(e);
    // 清理状态中不用执行到vback事件处理
    if(GLOBAL_STATES.cleaning) {
        // 当前历史地址是vback生成的, 就继续向上回溯
        if(e.state && e.state.vback) {
            console.log('v-back历史记录弹出');
            window.history.back();
            return;
        }
        // 由于浏览器是先触发历史记录加载再异步处理的popState事件
        // 不是的话等待一段时间看看是否地址发生了变化
        if(GLOBAL_STATES.cleanDoneWaitTimer) {
            clearTimeout(GLOBAL_STATES.cleanDoneWaitTimer);
        }
        GLOBAL_STATES.cleanDoneWaitTimer = setTimeout(() => {
            // 没有变化再自动触发一次返回
            if(GLOBAL_STATES.cleaningUrl === document.URL) {
                console.log('v-back历史记录清理后需自动返回');
                window.history.back();
            }
            // 结束清理
            _doneCleaning();
            console.log('v-back历史记录清理完成');
        }, GLOBAL_STATES.cleanDoneWaitMils);
        return;
    }
    // 有效间隔内方可触发
    if(! _isValidEventInterval(e)) {
        return;   
    }
    // 进行vback事件处理
    let isRealBack = true;
    for(let i = LISTENING_ELS.length - 1; i > -1; i --) {
        const el = LISTENING_ELS[i];
        if(el.VBACK_EVENT_STATES.canceling
            || el.VBACK_EVENT_STATES.poping) {
            continue;
        }
        el.VBACK_EVENT_STATES.poping = true;
        if(actPopState(el)) {
            isRealBack = false;
        }
        _nextTick(() => {
            el.VBACK_EVENT_STATES.poping = false;
        });
    }
    if(! isRealBack) {
        _cancelCleaning();
        return;
    }
    // 所有返回处理都结束时进入清理状态
    if(GLOBAL_STATES.triggerRealBackTimer) {
        clearTimeout(GLOBAL_STATES.triggerRealBackTimer);
    }
    GLOBAL_STATES.triggerRealBackTimer = setTimeout(() => {
        if(! GLOBAL_STATES.cleaning) {
            console.log('v-back已完成所有的返回处理, 将进行真正的历史返回');
            _setCleaning();
            window.history.back(); /* 触发一次以进入递归逻辑 */
        }
    }, GLOBAL_STATES.triggerRealBackWaitMils);
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

const _setCleaning = () => {
    GLOBAL_STATES.cleaning = true;
    GLOBAL_STATES.cleaningUrl = document.URL;
};

const _cancelCleaning = () => {
    GLOBAL_STATES.cleaning = false;
    GLOBAL_STATES.cleaningUrl = '';
};

const _doneCleaning = () => {
    GLOBAL_STATES.cleaning = false;
    GLOBAL_STATES.cleaningUrl = '';
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
    GLOBAL_STATES.actived = false;
    GLOBAL_STATES.cleaningUrl = '';
    GLOBAL_STATES.cleaning = false;
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

const initBackObj = (el, isRoot, key, inFn, outFn) => {
    if(! key) {
        return;
    }
    const oldObj = _getBackObj(el, key)
    if(oldObj) {
        return oldObj;
    }
    const newObj = {
        key: key,
        handleIn: inFn,
        handleOut: outFn,
        $root: isRoot,
        $el: el,
        $context: '',
        $watched: false,
        $statePushed: false,
        $statePoped: false,
    };
    el.VBACK_EVENT_KEYS.push(key);
    el.VBACK_EVENT_QUEUE.push(newObj);
    return newObj;
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
    console.log('v-back为' + backObj.key + '压入空历史记录等待返回事件触发, 目前history长度为' + window.history.length);
    // 数据中包括vback标记, 并且保证url与上次的不一样
    if(document.URL.indexOf('#vback') == -1) {
        window.history.pushState({vback:true}, null, document.URL +'#vback' + Date.now()); 
    } else {
        window.history.pushState({vback:true}, null, document.URL.replace(/#vback.*$/, '#vback'+ Date.now()));
    }
    backObj.$statePoped = false;
    backObj.$statePushed = true;
    _cancelCleaning();
    if(Utils.isFunc(backObj.handleIn)) {
        console.log('v-back初始化事件, 调用in回调, 目前history长度为' + window.history.length);
        _nextTick(() => {
            backObj.handleIn.call(backObj.$context);
        });
    }
};

const actPopState = (el) => {
    for(let i = el.VBACK_EVENT_QUEUE.length - 1; i > -1 ; i --) {
        const backObj = el.VBACK_EVENT_QUEUE[i];
        if(! backObj.$context
            || ! backObj.$watched
            || ! backObj.$statePushed
            || backObj.$statePoped) {
            continue;
        }
        backObj.$statePushed = false;
        backObj.$statePoped = true;
        if(backObj.$root 
            && ! GLOBAL_STATES.actived) {
            continue;
        }
        if(Utils.isFunc(backObj.handleOut)) {
            console.log('v-back返回事件被触发, 为' + backObj.key + '调用out回调, 目前history长度为' + window.history.length);
            _nextTick(() => {
                backObj.handleOut.call(backObj.$context);
            });
        } else {
            console.log('v-back返回事件被触发, 设置' + backObj.key + '值为false, 目前history长度为' + window.history.length);
            const parent = _parentOfKey(backObj.$context, backObj.key);
            const argKey = _keyOf(backObj.key);
            backObj.$context.$set(parent, argKey, false);
        }
        if(! backObj.$root) {
            GLOBAL_STATES.actived = true;
        }
        return true;
    }
    return false;
};

const cancelPushStateTrick = (el, backObj) => {
    if(el.VBACK_EVENT_STATES.poping
        || el.VBACK_EVENT_STATES.canceling
        || backObj.$root
        || ! backObj.$statePushed) {
        return;
    }
    console.log('v-back为' + backObj.key + '取消空历史记录, 目前history长度为' + window.history.length);
    backObj.$statePushed = false;
    backObj.$statePoped = false;
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