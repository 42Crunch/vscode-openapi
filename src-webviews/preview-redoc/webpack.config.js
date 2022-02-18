const path = require("path");
const webpack = require("webpack");

module.exports = {
  target: "web",
  entry: path.resolve(__dirname, "index.tsx"),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(__dirname, "tsconfig.json"),
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    fallback: {
      https: false,
      http: false,
      os: false,
      url: require.resolve("url"),
      path: require.resolve("path-browserify"),
      tty: require.resolve("tty-browserify"),
    },
    extensions: [".tsx", ".ts", ".js"],
  },
  mode: "production",
  plugins: [
    new webpack.ProvidePlugin({
      process: require.resolve("process/browser"),
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
