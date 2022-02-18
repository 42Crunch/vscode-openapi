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
    fallback: { stream: require.resolve("stream-browserify") },
    extensions: [".tsx", ".ts", ".js"],
  },
  mode: "production",
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
  ],
};
