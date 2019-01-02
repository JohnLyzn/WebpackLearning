const path = require('path');
const config = require('../config');
const env = process.env.NODE_ENV;

exports.environment = function() {
    return env;
};

exports.path = function() {
    return env === 'production' 
        ? config.prod.path 
        : config.dev.path;
};

// 选择打包的静态资源存放目录
exports.assetsPath = function(pathPiece) {
    const assetsRoot = env === 'production' 
        ? config.prod.assetsRoot 
        : config.dev.assetsRoot;
    if(! pathPiece) {
        return assetsRoot;
    }
    return path.posix.join(assetsRoot, pathPiece)
};

// 选择输出路径存放目录
exports.assetsPublicPath = function() {
    return env === 'production' 
        ? config.prod.assetsPublicPath 
        : config.dev.assetsPublicPath;
};

// check env & config/index.js to decide weither to enable CSS Sourcemaps for the
// various preprocessor loaders added to vue-loader at the end of this file
exports.useCssSourceMap = function() {
    return (env === 'development' && config.dev.cssSourceMap) 
        || (env === 'production' && config.prod.cssSourceMap);
};