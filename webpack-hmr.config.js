const nodeExternals = require('webpack-node-externals');
const { RunScriptWebpackPlugin } = require('run-script-webpack-plugin');
const path = require('path');

module.exports = function (options, webpack) {
  return {
    ...options,
    watchOptions: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tmp/**',
      ],
      poll: 1000,
    },
    entry: ['webpack/hot/poll?100', options.entry],
    externals: [
      nodeExternals({
        allowlist: ['webpack/hot/poll?100'],
      }),
    ],
    plugins: [
      ...options.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.WatchIgnorePlugin({
        paths: [/\.js$/, /\.d\.ts$/, path.join(__dirname, 'tmp')],
      }),
      new RunScriptWebpackPlugin({ name: options.output.filename, autoRestart: true  }),
    ],
  };
};
