module.exports = (shell, options) => {

  shell
    .command('controller reset [type]', 'Reset the controller')
    .autocomplete(['soft', 'hard'])
    .option('-y', 'Skips confirmation prompt for hard reset')
    .action(function(args, cb) {
      var self = this;
      if (!args.type) { args.type = 'soft'; }
      if (args.type == 'hard') {
        if (!args.options.y) {
          return this.prompt({
            type: 'confirm',
            name: 'reset',
            default: false,
            message: 'A hard reset will remove all configuration from the controller. Continue?'
          }, function (result) {
            if (result.reset) {
              shell.zwave.hardReset();
            }
            cb();
          });
        } else {
          shell.zwave.hardReset();
        }
      } else {
        shell.zwave.softReset();
      }
      cb();
    });

};
