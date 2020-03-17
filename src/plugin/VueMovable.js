const positionOf = (e) => {
    if(e.clientX) {
        return e;
    }
    if(e.targetTouches && e.targetTouches.length) {
        return e.targetTouches[0];
    }
    if(e.changedTouches && e.changedTouches.length) {
        return e.changedTouches[0];
    }
    throw Error('unknown position event source!');
};
const typeOf = (e) => {
    if(e.targetTouches || e.changedTouches) {
        return 'touch';
    }
    return 'mouse';
};
const getTriggerEl = (el, binding) => {
    if(typeof(binding.value) === 'object') {
        if(binding.value.trigger) {
            return el.querySelector(binding.value.trigger);
        }
    }
    return el;
};
const notifyClick = (e, binding) => {
    if(typeof(binding.value) === 'object') {
        if(binding.value.onClick) {
            return binding.value.onclick(e);
        }
    }
};
const stopBubble = (event) => {
    event = event || window.event;
    event.cancelBubble && (event.cancelBubble = true);
    event.stopPropagation && event.stopPropagation();
    event.returnValue && (event.returnValue = false);
    event.preventDefault && event.preventDefault();
};
const VueMovable = {
    install: function(Vue, options) {
        Vue.directive('movable', {
            bind: function (el, binding) {
                const triggerEl = getTriggerEl(el, binding);
                if(! triggerEl) {
                    throw new Error('无效的拖动触发源');
                }
                triggerEl.ontouchstart = triggerEl.onmousedown = (e) => {
                    stopBubble(e);
                    if((el.$triggerEventType && el.$triggerEventType != typeOf(e))
                        || (el.$startTime && new Date().getTime() - el.$startTime < 150)) {
                        return;
                    }
                    el.$triggerEventType = typeOf(e);
                    el.$startTime = new Date().getTime();
                    //算出鼠标相对元素的位置
                    let disX = positionOf(e).clientX - el.offsetLeft;
                    let disY = positionOf(e).clientY - el.offsetTop;
                    // 鼠标移动事件
                    document.ontouchmove = document.onmousemove = (e) => {
                        //用鼠标的位置减去鼠标相对元素的位置，得到元素的位置
                        let left = positionOf(e).clientX - disX;    
                        let top = positionOf(e).clientY - disY;
                        //移动当前元素
                        el.style.left = left + 'px';
                        el.style.top = top + 'px';
                    };
                    document.ontouchend = document.onmouseup = (e) => {
                        document.onmousemove = null;
                        document.onmouseup = null;
                        document.ontouchmove = null;
                        document.ontouchend = null;
                        // 调用回调
                        if(el.$triggerEventType == typeOf(e) 
                            && new Date().getTime() - el.$startTime < 150) {
                            notifyClick(e, binding);
                            el.$startTime = new Date().getTime();
                        }
                    };
                };
            }
        });
    }
};
export default VueMovable;