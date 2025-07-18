const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

// Custom plugin to add shebang to CLI file
class ShebangPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('ShebangPlugin', (compilation, callback) => {
      const cliAsset = compilation.assets['cli.js'];
      if (cliAsset) {
        const source = cliAsset.source();
        const sourceWithShebang = `#!/usr/bin/env node\n${source}`;
        compilation.assets['cli.js'] = {
          source: () => sourceWithShebang,
          size: () => sourceWithShebang.length,
        };
      }
      callback();
    });
  }
}

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
      // Inject environment variables into the bundle (development only)
      ...(!isProduction
        ? [
            new webpack.DefinePlugin({
              'process.env.DATABASE_URL': JSON.stringify(process.env.DATABASE_URL),
              'process.env.MCP_SERVER_NAME': JSON.stringify(process.env.MCP_SERVER_NAME),
              'process.env.MCP_SERVER_VERSION': JSON.stringify(process.env.MCP_SERVER_VERSION),
              'process.env.MCP_TRANSPORT_TYPE': JSON.stringify(process.env.MCP_TRANSPORT_TYPE),
              'process.env.PORT': JSON.stringify(process.env.PORT),
              'process.env.HOST': JSON.stringify(process.env.HOST),
              'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
            }),
          ]
        : []),
      // Copy templates to dist/templates (flattened)
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/domains/init-rules/templates',
            to: 'templates',
            globOptions: {
              ignore: ['**/.DS_Store'],
            },
          },
        ],
      }),
      // Add shebang to CLI file
      new ShebangPlugin(),
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
