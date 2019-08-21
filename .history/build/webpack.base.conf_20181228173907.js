const path = require('path');

const config = require('../config');
const context = require('./context');

const VueLoaderPlugin = require('vue-loader/lib/plugin')

const babelShim = [];
config.base.babelShim.forEach((babelShimPath) => {
    babelShim.push(path.resolve(__dirname, babelShimPath));
});

const WebpackBaseConfig = {
    mode: context.environment(),
    entry: {
        main: ['babel-polyfill', path.resolve(__dirname, '../src/main.js')],
    },
    output: {
        filename: context.assetsPath('js/[name].js'),
        path: path.resolve(__dirname, context.path()),
        publicPath: context.assetsPublicPath()
    },
    resolve: {
        extensions: ['.js', '.vue', '.css', '.scss', '.less'],
        alias: {
            'vue': 'vue/dist/vue.min.js',
            'vue$': 'vue/dist/vue.common.js',
            '@': path.resolve(__dirname, '../src'),
            'src': path.resolve(__dirname, '../src'),

            'images': path.resolve(__dirname, '../src/images'),
            'components': path.resolve(__dirname, '../src/components'),
            'style': path.resolve(__dirname, '../src/style'),
            'router': path.resolve(__dirname, '../src/router'),
            'store': path.resolve(__dirname, '../src/store'),
            'common': path.resolve(__dirname, '../src/common'),
            'plugin': path.resolve(__dirname, '../src/plugin'),
            'service': path.resolve(__dirname, '../src/service'),
            'model': path.resolve(__dirname, '../src/model'),
            'other': path.resolve(__dirname, '../src/other')
        }
    },
    module: {
        rules: [{
            test: /\.vue$/,
            loader: 'vue-loader',
        }, {
            test: /\.js$/,
            loader: 'babel-loader',
            include: [
                path.resolve(__dirname, '../src'),
                path.resolve(__dirname, '../test')
            ].concat(babelShim),
            exclude: file => (
                /node_modules/.test(file) &&
                !/\.vue\.js/.test(file)
            ),
            options: {
                presets: ['es2015']
            }
        }, { 
            test:/\.css$/,
            use: [
                'vue-style-loader',
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options:{
                        plugins:[
                            require("autoprefixer")(config.base.prefixerShim)
                        ]
                    }
                }
            ],
            exclude: path.resolve(__dirname, '/node_modules')
        }, {
            test: /\.s(a|c)ss$/,
            use: [
                'vue-style-loader',
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options:{
                        plugins:[
                            require("autoprefixer")(config.base.prefixerShim)
                        ]
                    }
                },
                'sass-loader',
            ],
            exclude: path.resolve(__dirname, '/node_modules')
          }, {
            test: /\.less$/,
            use: [
                'vue-style-loader',
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options:{
                        plugins:[
                            require("autoprefixer")(config.base.prefixerShim)
                        ]
                    }
                },
                'less-loader',
            ],
            exclude: path.resolve(__dirname, '/node_modules')
          }, {
            test: /\.json$/,
            loader: 'json-loader'
        }, {
            test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
            loader: 'url-loader',
            options: {
                limit: 10000,
                name: context.assetsPath('images/[name].[ext]')
            }
        }, {
            test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
            loader: 'url-loader',
            options: {
                limit: 10000,
                name: context.assetsPath('css/fonts/[name].[hash:7].[ext]')
            }
        }, {
            test: /\.(swf)(\?[a-z0-9]+)?$/,
            loader: 'file-loader',
            options: {
                limit: 10000,
                name: context.assetsPath('css/other/[name].[hash:7].[ext]')
            }
        }]
    },
    plugins: [
        new VueLoaderPlugin(),
    ],
};

module.exports = WebpackBaseConfig;
