const path = require('path');

module.exports = {
  entry: path.resolve(__dirname, 'index.tsx'),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  mode: 'production',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, '..', '..', 'webview', 'generated', 'preview', 'redoc'),
  },
};
