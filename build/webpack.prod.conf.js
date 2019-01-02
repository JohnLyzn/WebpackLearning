const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const config = require('../config');
const context = require('./context');

const WebpackBaseConfig = require('./webpack.base.conf');

const WebpackProductionConfig = merge(WebpackBaseConfig, {
    output: {
        chunkFilename: context.assetsPath('js/[name].[chunkhash].min.js')
    },
    performance: {
        hints: false
    },
    optimization: {
        minimizer: [new UglifyJsPlugin({
            cache: true,
            parallel: true,
            sourceMap: true
        }), new OptimizeCSSAssetsPlugin({

        })],
        splitChunks: {
            chunks: 'async',
            minSize: 30000,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            name: true,
            cacheGroups: {
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
                vendors: {
                    name: 'vendor',
                    chunks: 'initial',
                    priority: -10,
                    reuseExistingChunk: false,
                    test: /node_modules\/(.*)\.js/
                }
            }
        }
    },
    plugins: [
        // http://vuejs.github.io/vue-loader/en/workflow/production.html
        new webpack.DefinePlugin({
            'process.env': config.prod.env
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        // extract css into its own file
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: context.assetsPath('css/[name].css'),
            chunkFilename: context.assetsPath('css/[name].[contenthash:12].css')
        }),
        // see https://github.com/ampedandwired/html-webpack-plugin
        new HtmlWebpackPlugin({
            filename: 'main.html',
            template: path.resolve(__dirname, '../src/main.html'),
            inject: true,
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true
            },
            // necessary to consistently work with multiple chunks via CommonsChunkPlugin
            chunksSortMode: 'dependency'
        }),
    ]
});
/* 添加mincssloader到css文件处理中, 替换style-loader */
for(let rule of WebpackProductionConfig.module.rules) {
    if(rule.use && typeof rule.use[0] == 'string' && typeof rule.use[0].indexOf('style-loader')) {
        rule.use[0] = {
            loader: MiniCssExtractPlugin.loader,
            options: {
                publicPath: '../'
            }
        };
    }
}
/* 如果需要压缩则引入压缩插件 */
if (config.prod.gzip) {
    const CompressionWebpackPlugin = require('compression-webpack-plugin');
    WebpackProductionConfig.plugins.push(
        new CompressionWebpackPlugin({
            asset: '[path].gz[query]',
            algorithm: 'gzip',
            test: new RegExp(
                '\\.(' +
                config.prod.gzipExtensions.join('|') +
                ')$'
            ),
            threshold: 10240,
            minRatio: 0.8
        })
    );
}
module.exports = WebpackProductionConfig;