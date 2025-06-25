const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (options, webpack) => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    ...options,
    entry: {
      main: options.entry.main || './src/main.ts',
      cli: './src/cli.ts',
    },
    output: {
      ...options.output,
      // Only add hashing in production to avoid breaking development
      filename: (chunkData) => {
        if (chunkData.chunk.name === 'cli') {
          return 'cli.js'; // Keep CLI file name consistent for package.json bin
        }
        return isProduction ? '[name].[contenthash:8].js' : '[name].js';
      },
      chunkFilename: isProduction
        ? '[name].[contenthash:8].chunk.js'
        : '[name].chunk.js',
    },
    optimization: {
      ...options.optimization,
      minimize: isProduction,
      minimizer: isProduction
        ? [
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug'],
                },
                mangle: {
                  // Keep function names for better debugging in production
                  keep_fnames: false,
                },
                format: {
                  comments: false,
                },
              },
              extractComments: false,
            }),
          ]
        : [],
    },
    plugins: [
      ...options.plugins,
      // Only add compression in production
      ...(isProduction
        ? [
            new CompressionPlugin({
              filename: '[path][base].gz',
              algorithm: 'gzip',
              test: /\.(js|css|html|svg)$/,
              threshold: 8192,
              minRatio: 0.8,
            }),
            new CompressionPlugin({
              filename: '[path][base].br',
              algorithm: 'brotliCompress',
              test: /\.(js|css|html|svg)$/,
              compressionOptions: {
                params: {
                  [require('zlib').constants.BROTLI_PARAM_QUALITY]: 11,
                },
              },
              threshold: 8192,
              minRatio: 0.8,
            }),
          ]
        : []),
    ],
  };
};
