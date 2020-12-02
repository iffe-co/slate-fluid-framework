const path = require('path');
module.exports = {
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testEnvironment: 'jest-environment-node',
  rootDir: '../packages',
  moduleDirectories: ['node_modules'],
  collectCoverage: true,
  coverageDirectory: path.resolve(__dirname, '../coverage'),
  collectCoverageFrom: [
    '**/src/**',
    '!**/dist/**',
  ],
  testURL: 'https://www.shuidichou.com/jd',
  testMatch: ['**/test/**/?(*.)+(spec).ts'],
  testPathIgnorePatterns: [
    // 忽略测试路径
    'node_modules/',
  ],
  transformIgnorePatterns: ['node_modules/(?!(@solidoc))'],
  coverageThreshold: {
    // 配置测试最低阈值
    global: {
      // branches: 80,
      // functions: 80,
      // lines: 80,
      // statements: 80,
    },
  },
};
