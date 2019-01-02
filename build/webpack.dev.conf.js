const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const config = require('../config');

const WebpackBaseConfig = require('./webpack.base.conf');

// add hot-reload related code to entry chunks
Object.keys(WebpackBaseConfig.entry).forEach(function(name) {
    WebpackBaseConfig.entry[name] = ['./build/client'].concat(WebpackBaseConfig.entry[name])
});

module.exports = merge(WebpackBaseConfig, {
    devtool: 'cheap-module-source-map',
    plugins: [
        new webpack.DefinePlugin({
            'process.env': config.dev.env,
        }),
        // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        // https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
            filename: 'main.html',
            template: path.resolve(__dirname, '../src/main.html'),
            favicon: 'favicon.ico',
            inject: true
        })
    ]
});