/* 提供一些脚手架, 解决某些插件的运行问题 */
export const installMintUI = (Vue, names) => {
    const MintUI = require('mint-ui');
    for(let name of names) {
        let component = MintUI[name];
        if(! component) {
            console.warn('找不到ElementUI组件[' + name + ']!');
        }
        Vue.component(component.name, component);
    }
}

export const installElementUI = (Vue, names) => {
    const ElementUI = require('element-ui');
    for(let name of names) {
        let component = ElementUI[name];
        if(! component) {
            console.warn('找不到ElementUI组件[' + name + ']!');
        }
        Vue.use(component);
    }
}