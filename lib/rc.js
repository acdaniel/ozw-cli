const fs = require('fs');
const os = require('os');
const trim = require('trim');

module.exports = function (shell, rcfile) {
  if (typeof rcfile !== 'string') {
    shell.log(shell.chalk.red('Error: ') + ' No .rc file specified');
    return;
  }

  try {
    fs.readFileSync(rcfile, 'utf-8')
      .split(os.EOL)
      .filter(cmd => trim(cmd).length)
      .forEach(cmd => shell.exec(cmd));
  } catch (err) {
    shell.log(shell.chalk.red('Error: ') + err.message);
  }
};
