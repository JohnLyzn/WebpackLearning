// https://github.com/shelljs/shelljs
require('shelljs/global');

const path = require('path');
const webpack = require('webpack');

const context = require('./context');

const ora = require('ora');

const spinner = ora('building for production...');
spinner.start()

const assetsPath = path.join(path.resolve(__dirname, context.path()), context.assetsPath());
rm('-rf', assetsPath);
mkdir('-p', assetsPath);
// cp('-R', 'src/assets/*', assetsPath);

var webpackConfig;
if(context.environment() === 'production') {
    webpackConfig = require('./webpack.prod.conf')
} else {
    webpackConfig = require('./webpack.dev.conf');
}

webpack(webpackConfig, function(err, stats) {
    spinner.stop();
    if (err) throw err;
    process.stdout.write(stats.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false
    }) + '\n');
});

