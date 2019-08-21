// 此文件用于提供所有配置
// see http://vuejs-templates.github.io/webpack for documentation.
module.exports = {
    base: {
        index: 'main.html',
        prefixerShim: ['iOS >= 7', 'Android >= 4.1'],
    },
    dev: { /* 开发打包时相关配置 */
        env: {
            NODE_ENV: '"development"'
        },
        path: '../dev-dist',
        assetsRoot: 'resource',
        assetsPublicPath: '/',
         // CSS Sourcemaps off by default because relative paths are "buggy"
        // with this option, according to the CSS-Loader README
        // (https://github.com/webpack/css-loader#sourcemaps)
        // In our experience, they generally work as expected,
        // just be aware of this issue when enabling this option.
        cssSourceMap: false,
        server: {
            port: 8000,
            proxyPath: 'http://127.0.0.1:18080/',
            proxyFor: [ //代理路径
                '/LiveVideoViewTool',
            ],
        }
    },
    prod: {
        env: {
            NODE_ENV: '"production"' 
        },
        path: '../dist',
        assetsRoot: '',
        assetsPublicPath: '${resourceUrl}/', /* 如果想在本地环境打开, 使用 './' */
        cssSourceMap: true,
        // Surge or Netlify already gzip all static assets for you.
        // Before setting to `true`, make sure to:
        // npm install --save-dev compression-webpack-plugin
        gzip: false,
        gzipExtensions: ['js', 'css']
    }
};
