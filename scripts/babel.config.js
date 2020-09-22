module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false,
        useBuiltIns: 'usage',
        // https://babeljs.io/docs/en/babel-plugin-transform-runtime#corejs
        corejs: 3,
      },
    ],
    // https://www.babeljs.cn/docs/babel-preset-typescript
    '@babel/preset-typescript',
    // https://www.babeljs.cn/docs/babel-preset-react
    '@babel/preset-react',
  ],
  plugins: ['lodash'],
};
