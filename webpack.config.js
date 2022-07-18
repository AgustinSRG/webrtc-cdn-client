const path = require('path');
module.exports = {
    mode: "production",
    entry: "./src/index.ts",
    output: {
        filename: "webrtc-cdn-client.js",
        path: path.resolve(__dirname, 'dist.webpack'),
        library: "WebRTC_CDN",
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".js"]
    },
    module: {
        rules: [{ test: /\.ts$/, loader: "ts-loader" }]
    }
}
