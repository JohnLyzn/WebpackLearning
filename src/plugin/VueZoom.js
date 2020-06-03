
const _style = (el, prop) => {
    return typeof getComputedStyle !== 'undefined'
        ? getComputedStyle(el, null).getPropertyValue(prop) 
        : el.style[prop];
};

const _overflow = (el) =>  {
    return _style(el, 'overflow') 
        + _style(el, 'overflow-y') 
        + _style(el, 'overflow-x');
};

const _scrollParent = (el) => {
    if(! (el instanceof HTMLElement)) {
        return window;
    }
    let parent = el;
    while (parent) {
        if (parent === document.body 
            || parent === document.documentElement) {
            break;
        }
        if (! parent.parentNode) {
            break;
        }
        if (/(scroll|auto)/.test(_overflow(parent))) {
            return parent;
        }
        parent = parent.parentNode;
    }
    return window;
};

const _distance = (touch1, touch2) => {
    return Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) 
        + Math.pow(touch2.clientY - touch1.clientY, 2)
    );
};

const _analysisArgs = (el, binding) => {

};

const _init = (el, setting) => {
    if(el._VUEZOOM) {
        return;
    }
    el._VUEZOOM = {
        isDoubleTouches: false,
        originScrollTop: 0,
        originScrollLeft: 0,
        startDistance: 0,
        lastScale: 1,
        nowScale: 1,
    };
    el.style.transformOrigin = '0% 0%';
    el.addEventListener('touchstart', function(e) {
        if(e.touches.length != 2) {
            return;
        }
        el._VUEZOOM.isDoubleTouches = true;
        el._VUEZOOM.startDistance = _distance(e.touches[0], e.touches[1]);
        _storeScrollorOrigin(el);
    });
    el.addEventListener('touchmove', function(e) {
        if(! el._VUEZOOM.isDoubleTouches || e.touches.length != 2) {
            return;
        }
        const nowDistance = _distance(e.touches[0], e.touches[1]);
        const radio = nowDistance / el._VUEZOOM.startDistance;
        _zoom(el, radio, true);
        _keepScrollorCenter(el);
    });
    el.addEventListener('touchend', function(e) {
        if (! el._VUEZOOM.isDoubleTouches) {
            return;
        }
        el._VUEZOOM.isDoubleTouches = false;
        _doneZoom(el);
    });
    el.addEventListener('wheel', function(e) {
        if(! e.altKey) {
            return;
        }
        e.preventDefault();
        let radio = 0.02;
        if(e.wheelDeltaY < 0) {
            radio = - radio;
        }
        _storeScrollorOrigin(el);
        _zoom(el, radio);
        _keepScrollorCenter(el);
        _doneZoom(el);
    });
};

const _storeScrollorOrigin = (el) => {
    const scrollParent = _scrollParent(el);
    el._VUEZOOM.originScrollTop = parseInt(scrollParent.scrollTop || scrollParent.scrollY || 0);
    el._VUEZOOM.originScrollLeft = parseInt(scrollParent.scrollLeft || scrollParent.scrollX || 0);
};

const _keepScrollorCenter = (el) => {
    const scrollParent = _scrollParent(el);
    // 滚动窗口，实现中心缩放的效果
    const translateW = (el.offsetWidth * (el._VUEZOOM.nowScale - el._VUEZOOM.lastScale)) / 2;
    const translateH = (el.offsetHeight * (el._VUEZOOM.nowScale - el._VUEZOOM.lastScale)) / 2;
    if(scrollParent === window) {
        scrollParent.scrollTo(el._VUEZOOM.originScrollTop + translateH, el._VUEZOOM.originScrollLeft + translateW);
    } else {
        console.log(el._VUEZOOM.originScrollTop, el._VUEZOOM.originScrollLeft);
        scrollParent.scrollTop = el._VUEZOOM.originScrollTop + translateH;
        scrollParent.scrollLeft = el._VUEZOOM.originScrollLeft + translateW;
    }
};

const _zoom = (el, radio, isMulti) => {
    let zoomScale = isMulti ? (el._VUEZOOM.lastScale * radio) : (el._VUEZOOM.lastScale + radio);
    if (zoomScale < 1) {
        zoomScale = 1;
    }
    el._VUEZOOM.nowScale = zoomScale;
    el.style.transform = 'scale(' + zoomScale + ')';
};

const _doneZoom = (el) => {
    el._VUEZOOM.lastScale = el._VUEZOOM.nowScale;
};

const VueZoom = {
    install: function(Vue, options) {
        Vue.directive('zoom', {
            bind: function (el, binding, vnode) {
                _init(el, _analysisArgs(el, binding));
            },
            unbind: function(el, binding, vnode) {
            },
        });
    },
};
export default VueZoom;