'use strict';

var path = require('path');

module.exports = {
    entry: path.join(__dirname, './src/client.jsx'),
    resolve: {
        extensions: ['', '.js', '.jsx']
    },
    output: {
        path: path.join(__dirname, 'public/assets/js'),
        filename: 'client.js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: [/node_modules/],
                loader: 'babel-loader',
                query: {
                    presets: ['stage-0', 'es2015', 'react']
                }
            },
            {
                test: /\.s(a|c)ss$/,
                loaders: ['style', 'css', 'sass']
            }
        ]
    },
    sassLoader: {
        includePaths: [
            path.resolve(__dirname, 'node_modules/bourbon/app/assets/stylesheets'),
            path.resolve(__dirname, 'node_modules/bourbon-neat/app/assets/stylesheets')
        ]
    }
};
