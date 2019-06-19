/* 提供一些脚手架, 解决某些插件的运行问题 */
export const installMuseUI = (Vue, names) => {
    const MuseUI = require('muse-ui');
    for(let name of names) {
        let component = MuseUI[name];
        if(! component) {
            console.warn('找不到MuseUI组件[' + name + ']!');
        }
        Vue.component(component.name, component);
    }
}