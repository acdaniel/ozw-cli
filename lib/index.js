const package = require('./package');
const program = require('commander');
const ZWave = require('openzwave-shared');
const rc = require('./rc');
const shell = require('vorpal')();
require('./ui')(shell);

var rcFile;
var color = shell.chalk;
var shellInitialized = false;

shell.zwave = null;
shell.zwavePort = null;
shell.zwaveOptions = {};
shell.zwaveHomeId = null;
shell.zwaveNodes = {};
shell.zwaveValues = {};

program
  .version(package.version)
  .description(package.description)
  .arguments('<port> [file]')
  .option('-u, --UserPath <path>', 'This is the directory location where various files created by the library are stored')
  .option('-c, --ConfigPath <path>', 'This is the directory where the device database resides')
  .option('-l, --Logging <bool>', 'Enable Logging in the Library or not')
  .option('-f, --LogFileName <file>', 'The Log File Name to use (will be output in the UserPath Directory')
  .option('-a, --AppendLogFile <bool>', 'On Restart, should we erase old log files, or append to existing log files')
  .option('-s, --SaveLogLevel <level>')
  .option('-q, --QueueLogLevel <level>')
  .option('-d, --DumpTriggerLevel <level>')
  .option('-k, --NetworkKey <key>', 'Network Key to use for Encrypting Secure Messages over the Network')
  .action(function (port, file, cmd) {
    rcFile = file;
    shell.zwavePort = port;
    if (cmd.UserPath) { shell.zwaveOptions.UserPath = cmd.UserPath; }
    if (cmd.ConfigPath) { shell.zwaveOptions.ConfigPath = cmd.ConfigPath; }
    if (cmd.Logging) { shell.zwaveOptions.Logging = cmd.Logging; }
    if (cmd.LogFileName) { shell.zwaveOptions.LogFileName = cmd.LogFileName; }
    if (cmd.AppendLogFile) { shell.zwaveOptions.AppendLogFile = cmd.AppendLogFile; }
    if (cmd.SaveLogLevel) { shell.zwaveOptions.SaveLogLevel = cmd.SaveLogLevel; }
    if (cmd.QueueLogLevel) { shell.zwaveOptions.QueueLogLevel = cmd.QueueLogLevel; }
    if (cmd.DumpTriggerLevel) { shell.zwaveOptions.DumpTriggerLevel = cmd.DumpTriggerLevel; }
    if (cmd.NetworkKey) { shell.zwaveOptions.NetworkKey = cmd.NetworkKey; }
    shell.zwaveOptions.ConsoleOutput = false;
  })
  .parse(process.argv);

if (!shell.zwavePort) {
  program.help();
  return;
}

shell.log(color.styles.gray.open);
shell.zwave = new ZWave(shell.zwaveOptions);
shell.zwave.connect(shell.zwavePort);
shell.log(color.styles.gray.close);

shell.ui.spinner.start('Initializing driver');

shell.zwave.on('driver ready', (homeId) => {
  shell.ui.spinner.stop('Driver ready');
  shell.zwaveHomeId = homeId;
  shell.zwaveNodes = {};
  shell.zwaveValues = {};
  shell.ui.spinner.start('Scanning network');
});

shell.zwave.on('driver failed', () => {
  shell.log(color.red.bold('ERROR') + ' Driver failed.');
});

shell.zwave.on('node added', (id) => {
  shell.zwaveNodes[id] = {
    id: id,
    manufacturer: '',
    manufacturerId: '',
    product: '',
    productType: '',
    productId: '',
    type: '',
    name: '',
    loc: '',
    ready: false
  };
});

shell.zwave.on('node naming', (id, info) => {
  shell.zwaveNodes[id].manufacturer = info.manufacturer;
  shell.zwaveNodes[id].manufacturerId = info.manufacturerid;
  shell.zwaveNodes[id].product = info.product;
  shell.zwaveNodes[id].productType = info.producttype;
  shell.zwaveNodes[id].productId = info.productid;
  shell.zwaveNodes[id].type = info.type;
  shell.zwaveNodes[id].name = info.name;
  shell.zwaveNodes[id].loc = info.loc;
});

shell.zwave.on('node ready', (id, info) => {
  shell.zwaveNodes[id].manufacturer = info.manufacturer;
  shell.zwaveNodes[id].manufacturerId = info.manufacturerid;
  shell.zwaveNodes[id].product = info.product;
  shell.zwaveNodes[id].productType = info.producttype;
  shell.zwaveNodes[id].productId = info.productid;
  shell.zwaveNodes[id].type = info.type;
  shell.zwaveNodes[id].name = info.name;
  shell.zwaveNodes[id].loc = info.loc;
  shell.zwaveNodes[id].ready = true;
});

shell.zwave.on('value added', (id, cmdClass, value) => {
  shell.zwaveValues[value.value_id] = value;
});

shell.zwave.on('value removed', (id, cmdClass, instance, index) => {
  var valueId = arguments.join('-');
  delete shell.zwaveValues[valueId];
});

shell.zwave.on('value changed', (id, cmdClass, value) => {
  shell.zwaveValues[value.value_id] = value;
});

shell.zwave.on('scan complete', () => {
  shell.ui.spinner.stop('Scan complete');
  shell.log();
  shell.log('    Home Id    : %s', shell.zwaveHomeId);
  shell.log('    Node Count : %s', Object.keys(shell.zwaveNodes).length);
  if (!shellInitialized) {
    shell
      .use(require('./controller'))
      .use(require('./node'))
      .use(require('./record'));
    if (rcFile) {
      shell.use(rc, rcFile);
    }
    shell.log();
    shell
      .delimiter('ozw$')
      .show();
    shellInitialized = true;
  }
});
