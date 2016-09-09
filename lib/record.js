const fs = require('fs');
const os = require('os');
const trim = require('trim');

var commands = [];


module.exports = (shell, options) => {

  function handleCmd(e) {
    if (e.command !== 'record start') {
      commands.push(e.command);
    }
  }

  shell
    .command('record start', 'Record the following commands')
    .action(function (args, cb) {
      shell.on('client_command_executed', handleCmd);
      cb();
    });

  shell
    .command('record stop <file>', 'Save the recorded commands to a file')
    .action(function (args, cb) {
      shell.removeListener('client_command_executed', handleCmd);
      var str = commands.join(os.EOL);
      commands = [];
      fs.writeFileSync(args.file, str);
      cb();
    });

};
