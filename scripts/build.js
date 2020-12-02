const minimist = require('minimist');
const rawArgs = process.argv.slice(2);
const args = minimist(rawArgs);
const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const rollupOptions = require('./rollup.config');

// 遍历所有的包生成配置参数
const packageBuildConfig = {};
const packages = fs.readdirSync(path.resolve(__dirname, '../packages/'));
packages
  .filter(item => /^([^.]+)$/.test(item))
  .forEach(item => {
    let packagePath = path.resolve(__dirname, '../packages/', item);
    const {
      name,
      dependencies,
      devDependencies,
      peerDependencies,
    } = require(path.resolve(packagePath, 'package.json'));
    packageBuildConfig[item] = {
      path: packagePath,
      name,
      externals: Object.keys(dependencies || {})
        .concat(Object.keys(peerDependencies || {}))
        .concat(Object.keys(devDependencies || {}))
        .concat(['react', 'react-dom', 'slate', 'slate-react', 'uuid']),
    };
  });

const bundleTypes = ['es', 'cjs'];

function build(configs, isWatch) {
  console.info('\n========> 运行编译脚本');
  let buildSuccessNum = 0;

  const buildPkgs = configs.map(item => {
    return item.name;
  });
  console.info('编译:', buildPkgs);

  // 遍历执行配置项
  configs.forEach(async config => {
    const { name: pkgname } = config;

    // 获取编译配置
    let inputOptions;
    const outputOptions = bundleTypes.map(format => {
      const option = rollupOptions(config, format);
      inputOptions = option.inputOptions;
      return option.outputOptions;
    });

    // 开始编译
    outputOptions.forEach(async (outputOp, index) => {
      const { name, file } = outputOp;
      console.log(`创建编译选项：${name} -> ${file}`);
      const bundle = await rollup.rollup(inputOptions);
      await bundle.write(outputOp);
    });

    // 监听编译
    const watcher = rollup.watch({
      ...inputOptions,
      output: outputOptions,
      watch: {},
    });

    watcher.on('event', event => {
      const { code } = event;

      if (code === 'BUNDLE_START') {
        console.info('开始编译', pkgname);
      } else if (code === 'BUNDLE_END') {
        const { duration } = event;
        console.info(`编译成功 ${pkgname}, 耗时:`, duration);
        buildSuccessNum++;

        if (buildSuccessNum === configs.length) {
          console.info(`全部编译结束,成功:${buildSuccessNum}个`);
          if (isWatch) {
            console.info(`已开启热更新,监听中...`);
          }
        }
        if (!isWatch) {
          watcher.close();
        }
      } else if (code === 'ERROR' || code === 'FATAL') {
        console.info('错误:', event);
        if (!isWatch) {
          watcher.close();
        }
      }
    });
  });
}

// 根据 -p 参数获取执行对应的webpack配置项
const isWatch = !!args.watch;
if (args.p) {
  const pkgNames = args.p.split(',');
  const filterPkgs = pkgNames.filter(pkgName => {
    return packageBuildConfig[pkgName];
  });
  const buildPkgs = filterPkgs.map(pkgName => {
    return packageBuildConfig[pkgName];
  });
  if (buildPkgs.length > 0) {
    build(buildPkgs, isWatch);
  } else {
    console.error(`${args.p} 不存在!`);
  }
} else {
  // 执行所有配置
  build(Object.values(packageBuildConfig), isWatch);
}
