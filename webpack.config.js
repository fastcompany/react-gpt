var webpack = require("webpack");
var env = process.env.NODE_ENV;

var reactExternal = {
    root: "React",
    commonjs2: "react",
    commonjs: "react",
    amd: "react"
};

var reactDomExternal = {
    root: "ReactDOM",
    commonjs2: "react-dom",
    commonjs: "react-dom",
    amd: "react-dom"
};

var propTypes = {
    root: "PropTypes",
    commonjs2: "prop-types",
    commonjs: "prop-types",
    amd: "prop-types"
};

var config = {
    externals: {
        "react": reactExternal,
        "react-dom": reactDomExternal,
        "prop-types": propTypes
    },
    module: {
        loaders: [
            {test: /\.js$/, loaders: ["babel-loader"], exclude: /node_modules/}
        ]
    },
    output: {
        library: "ReactGPT",
        libraryTarget: "umd"
    },
    plugins: [
        new webpack.DefinePlugin({
            "process.env.NODE_ENV": JSON.stringify(env)
        })
    ]
};

module.exports = config;
