const fs = require('fs');
const path = require('path');
const shell = require('shelljs');

function compare(version1, version2) {
  let arr1 = version1.split('.'); //版本1分割
  let arr2 = version2.split('.'); //版本2分割
  let [firstFlag, secondFlag, thirdFlag] = [false, false, false]; //定义版本的三个部分大小标志
  //1.判断第一位
  if (Number.parseInt(arr1[0]) > Number.parseInt(arr2[0])) {
    firstFlag = true;
  }
  //2.判断第二位
  if (Number.parseInt(arr1[1]) > Number.parseInt(arr2[1])) {
    secondFlag = true;
  }
  /*3.判断第三位
      1.全部为数字  
      2.全部为字母
      3.数字字母混合
  */
  if (Number(arr1[2]) && Number(arr2[2])) {
    thirdFlag = Number.parseInt(arr1[2]) > Number.parseInt(arr2[2]);
    //如果parseInt之后都为NaN，说明都是字母
  } else if (
    Number.isNaN(Number.parseInt(arr1[2])) &&
    Number.isNaN(Number.parseInt(arr2[2]))
  ) {
    thirdFlag = arr1[2].charCodeAt() > arr2[2].charCodeAt();
  } else {
    // console.log('字母和数字混合的');
    // let num1 = Number.parseInt(arr1[2]);
    // let num2 = Number.parseInt(arr2[2]);
    // let word1 = arr1[2].split(num1)[1];
    // let word2 = arr2[2].split(num2)[1];
    // if (num1 > num2) {
    //   thirdFlag = true;
    // } else {
    //   thirdFlag = word1.charCodeAt() > word2.charCodeAt();
    // }
  }
  return firstFlag || secondFlag || thirdFlag;
}

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

    console.log(
      'local-pkg-ver:',
      name,
      version,
      ' remote-ver: ',
      latestPubVer,
      compare(latestPubVer, version),
    );

    if (compare(latestPubVer, version)) return;
    try {
      shell.exec(`cd ${packagePath} && npm publish`, {
        silent: true,
      });
      console.log('publish ok:', name, version);
    } catch (error) {
      console.log('local-pkg-ver:', name, version, error);
    }
  });
