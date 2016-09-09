const defaults = require('defaults');
const chalk = require('chalk');
const Table = require('tty-table');
const humanize = require('string-humanize');
const util = require('util');
const inquirer = require('inquirer');

module.exports = function (shell) {

  shell.ui.tableTitle = (title) => {
    shell.log('\n   ' + title);
  };

  shell.ui.table = (title, data, props, options, cb) => {
    if (!cb) {
      cb = options;
      options = {};
    }
    options = defaults(options, {
      start: 0,
      limit: 10
    });
    var cols = props.map((prop) => {
      return {
        value: prop,
        alias: humanize(prop),
      };
    });
    var rows = [];
    var index = 0;
    for (var k in data) {
      if (index >= options.start && index < options.start + options.limit) {
        var d = data[k];
        var row = props.map((prop) => {
          var val = d[prop];
          return typeof val === 'undefined' ? '' : val;
        });
        rows.push(row);
      }
      index++;
    }
    var table = new Table(cols, rows, {
      borderColor: 'gray',
      align: 'left',
      headerAlign: 'left',
      headerColor: 'magenta',
      paddingLeft: 1,
      paddingRight: 1,
      paddingBottom: 0,
      paddingTop: 0,
      marginTop: 0,
      marginLeft: 2,
      marginRight: 2,
      marginBottom: 1,
      defaultValue: ''
    });
    shell.log('\n   ' + title);
    shell.ui.redraw(shell.chalk.yellow('   Loading ...'));
    shell.ui.redraw(table.render(cols, rows));
    shell.ui.redraw.done();
    if (index > options.start + options.limit) {
      inquirer.prompt([{
        type: 'confirm',
        name: 'more',
        message: util.format(
          'Showing items %d to %d of %d. Show more?',
          options.start + 1, options.start + options.limit, index)
      }]).then((result) => {
        if (result.more) {
          options.start = options.start + options.limit;
          if (title.substr(-8) !== ' (cont.)') {
            title += ' (cont.)';
          }
          shell.ui.table(title, data, props, options, cb);
        } else {
          shell.log();
          cb();
        }
      });
    } else {
      shell.log();
      cb();
    }
  };

  shell.ui.objectTable = (title, obj) => {
    var cols = [
      { color: 'bold', align: 'right', value: 'key', alias: 'Property', headerAlign: 'right' },
      { align: 'left', value: 'value', alias: 'Value', width: 75, headerAlign: 'left' }
    ];
    var rows = [];
    for (var p in obj) {
      rows.push({ key: humanize(p), value: obj[p]});
    }
    var table = new Table(cols, rows, {
      borderColor: 'gray',
      headerColor: 'magenta',
      paddingLeft: 1,
      paddingRight: 1,
      paddingBottom: 0,
      paddingTop: 0,
      marginTop: 0,
      marginLeft: 2,
      marginRight: 2,
      marginBottom: 1,
      defaultValue: ''
    });
    shell.log('\n   ' + title);
    shell.ui.redraw(shell.chalk.yellow('   Loading ...'));
    shell.ui.redraw(table.render());
    shell.ui.redraw.done();
  };

  shell.ui.spinner = {
    frames: ['|','/','-','\\'],
    label: '',
    info: null,
    style: {},
    interval: null,
    start: (label, options) => {
      options = options || {};
      const s = shell.ui.spinner;
      var f = 0;
      s.label = label;
      s.frames = options.frames || s.frames;
      s.style = defaults(options.style, {
        spinning: chalk.bold.yellow,
        complete: chalk.bold.green
      });
      s.interval = setInterval(() => {
        f = f >= s.frames.length ? 0 : f;
        var str = s.frames[f] + ' ' + s.label;
        if (s.style.spinning) {
          str = s.style.spinning(str);
        }
        if (s.info) {
          str += ' ' + (s.style.info ? s.style.info(s.info) : s.info);
        }
        shell.ui.redraw(str);
        f += 1;
      }, 80);
    },
    stop: (label, info) => {
      const s = shell.ui.spinner;
      clearInterval(s.interval);
      if (label) {
        var str = '✓ ' + label;
        if (s.style.complete) {
          str = s.style.complete(str);
        }
        if (info) {
          str += ' ' + (s.style.info ? s.style.info(info) : (info));
        }
        shell.ui.redraw(str);
      }
      shell.ui.redraw.done();
    },
    update: (label, info) => {
      shell.ui.spinner.label = label;
      shell.ui.spinner.info = info;
    }
  };

};
