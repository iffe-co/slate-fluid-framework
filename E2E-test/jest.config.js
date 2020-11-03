module.exports = {
  preset: "ts-jest",
  transform: {
    "^.+\\.js$": "babel-jest",
    "^.+\\.ts$": "ts-jest"
  },
  testMatch: [
    '**/*.e2e.ts',
  ],
  transformIgnorePatterns: ["<rootDir>/node_modules/(?!(@fluidframework|other-es-lib))"]
};
