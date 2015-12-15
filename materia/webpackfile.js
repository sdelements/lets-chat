'use strict';

var path = require('path');

module.exports = {
    entry: path.join(__dirname, './src/jsx/client.jsx'),
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
                test: /\.jsx$/,
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
    }
};
