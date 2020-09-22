const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

// 遍历所有的包获取版本
const packages = fs.readdirSync(path.resolve(__dirname, '../packages/'));
packages
  .filter(item => /^([^.]+)$/.test(item))
  .forEach(item => {
    let packagePath = path.resolve(__dirname, '../packages/', item);
    //获取package.json版本
    const { name, version } = require(path.resolve(
      packagePath,
      'package.json',
    ));

    //获取已发布的最新版本
    const latestPubVer = shell.exec(`yarn info ${name} dist-tags.latest -s`, {
      silent: true,
    }).stdout;

    console.log('local-pkg-ver:', name, version, ' remote-ver: ', latestPubVer);

    if (latestPubVer >= version) return;
    try {
      shell.exec(`cd ${packagePath} && npm publish`, {
        silent: true,
      });
      console.log('publish ok:', name, version);
    } catch (error) {
      console.log('local-pkg-ver:', name, version, error);
    }
  });
