const minimist = require('minimist');
const shell = require('shelljs');

const rawArgs = process.argv.slice(2);
const args = minimist(rawArgs);
if (args.p) {
  shell.exec(`node scripts/build.js --watch -p ${args.p}`, { async: true });
} else {
  shell.exec(`node scripts/build.js --watch`, { async: true });
}
shell.exec(`yarn rs-start`, { async: true });
