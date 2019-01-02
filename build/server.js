const webpack = require('webpack');

const express = require('express');

const config = require('../config');
const context = require('./context');

const server = express();

// 用于发布新的环境变量
var compiler, hotMiddleware, env, isNeedToReloadEnv;
// server accept assets
server.get('/', function(request, response) {
    if(request.query.env && env != request.query.env) {
        isNeedToReloadEnv = true;
        env = request.query.env;
    }
    if(compiler) {
        response.redirect(config.base.index);
        return;
    }
    var webpackConfig;
    if(context.environment() === 'production') {
        webpackConfig = require('./webpack.prod.conf')
    } else {
        webpackConfig = require('./webpack.dev.conf');
    }
    webpackConfig.output.publicPath = '/'; /* 固定路径 */

    compiler = webpack(webpackConfig);
    server.use(require('webpack-dev-middleware')(compiler, {
        publicPath: webpackConfig.output.publicPath,
        stats: {
            colors: true,
            chunks: false
        }
    }));
    // Define HTTP proxies to your custom API backend
    // https://github.com/chimurai/http-proxy-middleware
    hotMiddleware = require('webpack-hot-middleware')(compiler);
    // enable hot-reload and state-preserving
    // compilation error display
    server.use(hotMiddleware);
    // force page reload when html-webpack-plugin template changes
    compiler.hooks.done.tap('html-webpack-plugin', function() {
        hotMiddleware.publish({
            action: 'reload',
        });
    });
    if (config.dev.server.proxyFor && config.dev.server.proxyFor.length) {
        server.use(require('http-proxy-middleware')(config.dev.server.proxyFor, {
            target: config.dev.server.proxyPath,
            changeOrigin: true
        }));
    }
    // handle fallback for HTML5 history API
    // server.use(require('connect-history-api-fallback')());

    response.redirect(config.base.index);
});
server.get('/__webpack_hmr', function(request, response, next) {
    // 延时等待前端__webpack_hmr连接完成, 再推送事件
    if(compiler && isNeedToReloadEnv) {
        const timer = setTimeout(function() {
            hotMiddleware.publish({
                action: 'update-env',
                env: env,
            });
            clearTimeout(timer);
            isNeedToReloadEnv = false;
        }, 1000);
    }
    next();
});
// default port where dev server listens for incoming traffic
const port = process.env.PORT || config.dev.server.port;
server.listen(port, function(err) {
    if (err) {
        console.log(err)
        return
    }
    console.log('已启动调试服务器[端口: ' + port + '], 请到工具运行页面运行工具!\n')
});