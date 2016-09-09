const util = require('util');
const filter = require('filter-keys');
const pad = require('pad');
const truncate = require('truncate');

function cast (value, arg) {
  switch (value.type) {
    case 'int':
    case 'short':
    case 'byte':
    case 'list':
      return parseInt(arg);
    case 'bool':
      return arg === 'true' || arg == '1' ? true : false;
    case 'decimal':
      return parseFloat(arg);
    default:
      return arg;
  }
}

module.exports = (shell, options) => {

  shell
    .command('node refresh [nodeId]', 'Refreshes node information')
    .alias('nodes refresh')
    .action(function (args, cb) {
      if (typeof args.nodeId === 'undefined') {
        for (var nodeId in shell.zwaveNodes) {
          shell.zwave.refreshNodeInfo(nodeId);
        }
      } else {
        shell.zwave.refreshNodeInfo(args.nodeId);
      }
      cb();
    });

  shell
    .command('node list', 'Displays list of all nodes')
    .alias('nodes list')
    .option('-n, --name <name>', 'Filters the node list by name')
    .option('-l, --loc <loc>', 'Filters the node list by location')
    .option(
      '-p, --props <props>', 'Show specific node properties (comma delim list)',
      ['id', 'name', 'loc', 'type', 'product', 'productType', 'productId',
      'manufacturer', 'manufacturerId', 'ready']
    )
    .action(function (args, cb) {
      var rows = Object.values(shell.zwaveNodes).filter((node) => {
        if (typeof args.options.name !== 'undefined' && node.name != args.options.name) {
          return false;
        }
        if (typeof args.options.loc !== 'undefined' && node.loc != args.options.loc) {
          return false;
        }
        return true;
      });
      var props = (typeof args.options.props === 'undefined') ?
        ['id', 'name', 'loc', 'type', 'product', 'manufacturer', 'ready'] :
        args.options.props.split(',');
      shell.ui.table(shell.chalk.bold('Node List'), rows, props, cb);
    });

  shell
    .command('node desc <nodeId>', 'Describes the given node')
    .validate(function (args) {
      var node = shell.zwaveNodes[args.nodeId];
      if (!node) {
        return shell.chalk.red.bold('Oops,') + ' invalid node ID';
      }
      return true;
    })
    .action(function (args, cb){
      var node = shell.zwaveNodes[args.nodeId];
      shell.ui.objectTable(
        util.format(shell.chalk.bold('%s (%s)'), node.name || 'Node ' + node.id, node.product || 'Unknown'),
        node);
      cb();
    });

  shell
    .command('node value <valueId> [value]', 'Get or set a node value')
    .alias('node values')
    .option(
      '-g, --genre <genre>', 'Gets values in the given genre',
      ['user', 'system', 'config']
    )
    .option('-r, --readonly [readonly]', 'Gets read only values ')
    .option('-w, --writeonly [writeonly]', 'Gets write only values')
    .option(
      '-t, --type <type>', 'Gets values of the given type',
      ['bool', 'byte', 'decimal', 'int', 'list', 'schedule', 'short', 'string', 'button', 'raw']
    )
    .option(
      '-p, --props <props>', 'Show specific value properties (comma delim list)',
      [
        'node_id', 'class_id', 'index', 'instance', 'type', 'value', 'help',
        'size', 'genre', 'label', 'units', 'min', 'max', 'length', 'read_only',
        'write_only', 'value_id'
      ]
    )
    .types({
      boolean: ['readonly', 'writeonly'],
      string: ['valueId', 'value']
    })
    .autocomplete(function () {
      return Object.keys(shell.zwaveValues);
    })
    .validate(function (args) {
      var found = filter(shell.zwaveValues, args.valueId.toString());
      if (found.length === 0) {
        return shell.chalk.red.bold('Oops,') + ' value ID not found';
      }
      if (found.length > 1 && typeof args.value !== 'undefined') {
        return shell.chalk.red.bold('Oops,') + ' cannot set value for a wildcard ID';
      }
      return true;
    })
    .action(function (args, cb) {
      var node;
      if (typeof args.value !== 'undefined') {
        const value = shell.zwaveValues[args.valueId.toString()];
        node = shell.zwaveNodes[value.node_id];
        shell.zwave.setValue(value.node_id, value.class_id, value.instance, value.index, cast(value, args.value));
        cb();
        return;
      }
      var ids = filter(shell.zwaveValues, args.valueId.toString());
      var rows = ids.map((id) => {
        return shell.zwaveValues[id];
      });
      node = shell.zwaveNodes[rows[0].node_id];
      rows = rows.filter((row) => {
        if (typeof args.options.genre !== 'undefined' && row.genre != args.options.genre) {
          return false;
        }
        if (typeof args.options.type !== 'undefined' && row.type != args.options.type) {
          return false;
        }
        return true;
      });
      var props = (typeof args.options.props === 'undefined') ?
        ['value_id', 'label', 'value', 'type', 'units', 'genre'] :
        args.options.props.split(',');
      if (rows.length === 1) {
        shell.ui.objectTable(
          util.format(shell.chalk.bold('%s Value Details (%s)'), node.name || 'Node ' + node.id, node.product || 'Unknown'),
          rows[0]
        );
        cb();
      } else {
        shell.ui.table(
          util.format(shell.chalk.bold('%s Values (%s)'), node.name || 'Node ' + node.id, node.product || 'Unknown'),
          rows, props, cb
        );
      }
    });

  shell
    .command('node loc <nodeId> [loc]', 'Get or set the node location')
    .alias('node location')
    .validate(function (args) {
      var node = shell.zwaveNodes[args.nodeId];
      if (!node) {
        return shell.chalk.red.bold('Oops,') + ' invalid node ID';
      }
      return true;
    })
    .action(function (args, cb){
      var node = shell.zwaveNodes[args.nodeId];
      if (typeof args.loc !== 'undefined') {
        shell.zwave.setNodeLocation(args.nodeId, args.loc);
      }
      cb();
    });

  shell
    .command('node name <nodeId> [name]', 'Get or set the node name')
    .validate(function (args) {
      var node = shell.zwaveNodes[args.nodeId];
      if (!node) {
        return shell.chalk.red.bold('Oops,') + ' invalid node ID';
      }
      return true;
    })
    .action(function (args, cb){
      var node = shell.zwaveNodes[args.nodeId];
      if (typeof args.name !== 'undefined') {
        shell.zwave.setNodeName(args.nodeId, args.name);
      }
      cb();
    });

  shell
    .command('node on <nodeId>', 'Turns node on')
    .validate(function (args) {
      var node = shell.zwaveNodes[args.nodeId];
      if (!node) {
        return shell.chalk.red.bold('Oops,') + ' invalid node ID';
      }
      return true;
    })
    .action(function (args, cb){
      var node = shell.zwaveNodes[args.nodeId];
      shell.zwave.setNodeOn(args.nodeId);
      cb();
    });

  shell
    .command('node off <nodeId>', 'Turns node off')
    .validate(function (args) {
      var node = shell.zwaveNodes[args.nodeId];
      if (!node) {
        return shell.chalk.red.bold('Oops,') + ' invalid node ID';
      }
      return true;
    })
    .action(function (args, cb){
      var node = shell.zwaveNodes[args.nodeId];
      shell.zwave.setNodeOff(args.nodeId);
      cb();
    });

  shell
    .command('node level <nodeId> <level>', 'Sets a nodes level')
    .validate(function (args) {
      var node = shell.zwaveNodes[args.nodeId];
      if (!node) {
        return shell.chalk.red.bold('Oops,') + ' invalid node ID';
      }
      return true;
    })
    .action(function (args, cb){
      var node = shell.zwaveNodes[args.nodeId];
      shell.zwave.setNodeLevel(args.nodeId, args.level);
      cb();
    });

  shell
    .mode('node watch [nodeId]', 'Watch for node events and value changes')
    .delimiter('Type \'exit\' to stop:')
    .init(function (args, cb) {
      var self = this;
      var c = shell.chalk;
      var handleEvent = function (nodeId, data) {
        if (!args.nodeId || nodeId == args.nodeId) {
          var now = new Date().toLocaleTimeString();
          self.log(
            c.gray('  [%s]') + c.magenta(' EVENT') + ' %s %s',
            now,
            pad(' Node Id: ' + nodeId, 23),
            pad('Data: ' + c.yellow(data), 10)
          );
        }
      };
      var handleValueChange = function (nodeId, cmdClass, value) {
        if (!args.nodeId || nodeId == args.nodeId) {
          var now = new Date().toLocaleTimeString();
          self.log(
            c.gray('  [%s]') + c.blue(' VALUE') + ' %s %s',
            now,
            pad('Value Id: ' + value.value_id, 22),
            pad('Label: ' + truncate(value.label, 19), 28),
            pad('Value: ' + truncate(c.yellow(value.value), 19), 25),
            pad('Units: ' + truncate(value.units, 5), 12)
          );
        }
      };
      var handleExit = function () {
        shell.zwave.removeListener('node event', handleEvent);
        shell.zwave.removeListener('value changed', handleValueChange);
        shell.removeListener('mode_exit', handleExit);
        self.log();
      };
      shell.zwave.on('node event', handleEvent);
      shell.zwave.on('value changed', handleValueChange);
      shell.on('mode_exit', handleExit);
      this.log();
      cb();
    })
    .action(function (cmd, cb) {
      cb();
    });

};
