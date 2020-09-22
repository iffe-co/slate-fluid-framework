// eslint config
// https://cn.eslint.org/

module.exports = {
  extends: [
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:import/typescript',
  ],
  plugins: [],
  // @typescript-eslint/parser
  parser: '@typescript-eslint/parser',
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'import/extensions': 'off',
    'react/jsx-closing-bracket-location': 'off',
    'react/prop-types': 'off',
    'import/prefer-default-export': 'off',
    'import/no-unresolved': 'off',
    'react/display-name': 'off',
    'react/jsx-props-no-spreading': 'off',
    'no-plusplus': 'off',
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'no-unused-vars': ['warn', { args: 'all' }],
    'no-console': 'off',
    'import/no-named-as-default-member': 'off',
    'import/no-named-as-default': 'off',
    'jsx-a11y/no-autofocus': 'off',
  },
  env: {
    browser: true,
    es6: true,
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
};
