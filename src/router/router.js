
import App from '../components/App';

/* 最后一个参数就是分出来的模块名称, 根据需要定义数量 */
const home = r => require.ensure([], () => r(require('../components/home/index')), 'home');

export default [{
    path: '/',
    component: App, //顶层路由，对应index.html
    children: [ //二级路由。对应App.vue
        {
            path: '',
            redirect: '/home'
        },
        {
            path: '/home',
            component: home
        },
    ]
}];
