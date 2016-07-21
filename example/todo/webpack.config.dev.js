var path = require('path');
var webpack = require('webpack');

module.exports = {
    devtool: 'eval',
    entry: [
        'webpack-dev-server/client?http://localhost:7002',
        'webpack/hot/only-dev-server',
        './public/javascripts/app.js'
    ],
    output: {
        path: path.join(__dirname, 'public', "javascripts"),
        filename: 'bundle.js',
        publicPath: '/javascripts/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    module: {
        loaders: [{
            test: /\.js$/,
            loaders: ['react-hot', 'babel'],
            include: path.join(__dirname, 'public', "javascripts")
        }]
    }
};
