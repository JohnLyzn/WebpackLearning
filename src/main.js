import '@babel/polyfill';
import Vue from 'vue';
import VueRouter from 'vue-router';
import {mapMutations} from 'vuex'
import FastClick from 'fastclick';

import {getRunToolParam,getClientType,getConfigs} from 'common/env';
import {Config} from 'common/constants';
import routes from 'router/router';
import store from './store';

// 处理app旋转事件
// (function(doc, win) {
//     var docEl = doc.documentElement,
//         resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
//         // 计算字体相对大小
//         recalc = function() {
//             var clientWidth = docEl.clientWidth;
//             if (!clientWidth) return;
//             docEl.style.fontSize = 20 * (clientWidth / 320) + 'px';
//         };
//     if (!doc.addEventListener) return;
//     win.addEventListener(resizeEvt, recalc, false);
//     doc.addEventListener('DOMContentLoaded', recalc, false);
// })(document, window);
// 添加FastClick处理
if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function() {
        FastClick.attach(document.body);
    }, false);
}
// 注册SPA的Vue路由
Vue.use(VueRouter);

/* 根据平台选择类型 */

/* 创建路由 */
const router = new VueRouter({
	routes,
	mode: Config.ROUTER_MODE,
	strict: process.env.NODE_ENV !== 'production',
	scrollBehavior(to, from, savedPosition) {
	    if (savedPosition) {
		    return savedPosition
		} else {
			if (from.meta.keepAlive) {
				from.meta.savedPosition = document.body.scrollTop;
			}
		    return { x: 0, y: to.meta.savedPosition || 0 }
		}
	}
});
/* 创建根组件 */
new Vue({
	router,
	store,
	methods: {
		...mapMutations(['BIND_CURRENT']),
	},
	async mounted() {
		/* 解析工具运行参数 */
		const runToolParam = getRunToolParam() || '';
		if(/^\{.*\}$/.test(runToolParam)) {
			const runToolParamJson = JSON.parse(runToolParam);
		} else if(/^\d+$/.test(runToolParam)) {

		}
		/* 路由控制 */
		// this.$router.push({ path: '' });//跳转到该路由
		// this.$router.go(-1);//后退
		/* 获取基础信息 */
		// const config = await getConfigs();
		// window.g_currentUserId = config.userID;
		// this.BIND_CURRENT(config);
	},
}).$mount('#app');
