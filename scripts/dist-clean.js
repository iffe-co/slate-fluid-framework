const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

// 遍历所有的包获取版本
const packages = fs.readdirSync(path.resolve(__dirname, '../packages/'));
packages
  .filter(item => /^([^.]+)$/.test(item))
  .forEach(item => {
    let packagePath = path.resolve(__dirname, '../packages/', item);
    let distDirPath = packagePath + '/dist';
    try {
      shell.exec(`rm -fr ${distDirPath}`, {
        silent: true,
      });
      console.log('delete dist dir', item, distDirPath);
    } catch (error) {
      console.log('local-pkg-ver:', item, distDirPath, error);
    }
  });
