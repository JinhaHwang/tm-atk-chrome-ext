const path = require("path");
const webpack = require("webpack");

// const mode = process.env.NODE_ENV || "development";

module.exports = {
    mode: 'production',
    output: {
        filename: 'lib/atk.min.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: "babel-loader" // 바벨 로더를 추가한다
            }
        ]
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `빌드 날짜: ${new Date().toLocaleString()}`
        }),
    ],
};
