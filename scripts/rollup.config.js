const builtins = require('rollup-plugin-node-builtins');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');
const json = require('@rollup/plugin-json');
const babel = require('rollup-plugin-babel');
const postcss = require('rollup-plugin-postcss');
const globals = require('rollup-plugin-node-globals');
const { terser } = require('rollup-plugin-terser');
const fs = require('fs');
const path = require('path');
const babelConfig = require('./babel.config');

// rollup文档
// https://rollupjs.org/guide/en/
// 所有插件列表
// https://github.com/rollup/plugins

let buildFileNum = 0;
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

module.exports = (opt, format = 'cjs') => {
  const file = `${path.resolve(opt.path, './dist')}/index.${format}.js`;
  const getInput = filename => path.resolve(opt.path, `./src/${filename}`);
  const isTs = fs.existsSync(getInput('index.ts'));
  const input = isTs ? getInput('index.ts') : getInput('index.js');

  return {
    inputOptions: {
      input,
      plugins: [
        // 集成ts编译器
        // https://www.npmjs.com/package/rollup-plugin-typescript2
        isTs &&
          typescript({
            abortOnError: false,
            tsconfig: `${opt.path}/tsconfig.json`,
            clean: false,
            check: false,
          }),

        // 打包node—modules中的包
        // https://github.com/rollup/plugins/tree/master/packages/node-resolve
        resolve.nodeResolve({
          extensions,
          preferBuiltins: true,
        }),

        builtins(),

        // 将JS语法翻译为浏览器认识的语法，增强浏览器兼容性
        // https://github.com/rollup/rollup-plugin-babel
        babel({
          babelrc: false,
          runtimeHelpers: true,
          extensions,
          include: [`${opt.path}/src/**`],
          ...babelConfig,
        }),

        // 可以将json文件解析成es模块
        // https://github.com/rollup/plugins/tree/master/packages/json
        json(),

        // 打包css
        // https://github.com/remaxjs/rollup-plugin-postcss
        postcss({
          autoModules: true,
        }),

        // https://github.com/calvinmetcalf/rollup-plugin-node-globals#readme
        // globals(),

        // 将commonJs的模块打包成ES模块
        // https://github.com/rollup/plugins/tree/master/packages/commonjs
        // issues
        // https://github.com/rollup/plugins/issues/304
        commonjs({
          include: /node_modules/,
          // namedExports: {
          //   'node_modules/material-ui-popup-state/hooks.js': [
          //     'bindTrigger',
          //     'bindPopover',
          //   ],
          // },
        }),
      ],

      external: id => {
        // 所有第三方都不进行打包
        // https://rollupjs.org/guide/en/#warning-treating-module-as-external-dependency
        const bool = !!opt.externals.find(dep => {
          return dep === id || id.startsWith(`${dep}/`);
        });
        if (!bool) {
          //console.log('-build:--', id);
          buildFileNum++;
          if (buildFileNum % 50 === 0) {
            console.info(`打包文件数：${buildFileNum}个 ...`);
          }
        }
        return bool;
      },
    },
    outputOptions: {
      file,
      format,
      name: opt.name,
      sourcemap: true,
      exports: 'named',
      plugins: [
        //最小化包大小
        // https://github.com/TrySound/rollup-plugin-terser
        //terser(),
      ],
    },
  };
};
