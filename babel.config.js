
module.exports = {
  plugins: [
    ['module-resolver', {
      'root': ['.'],
      'alias': {
        '@': './src',
        '@server': './calculate-net-server/src'
      }
    }],
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-transform-modules-commonjs'
  ],
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        }
      }
    ]
  ],
  sourceMaps: false
}
