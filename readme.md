# ozw-cli

An interactive command line interface for open-zwave. Perfect for Raspberry Pi ZWave gateways.

## Prerequisites

This application depends on [openzwave-shared](https://www.npmjs.com/package/openzwave-shared) which has its own prerequisites that must be fulfilled before installing ozw-cli.

## Installation

```
$ npm install ozw-cli -g
```

## Usage

### Connect

```
Usage: ozw [options] <port> [file]

  Interactive command line interface for open-zwave

  Options:


    -h, --help                      output usage information
    -V, --version                   output the version number
    -u, --UserPath <path>           This is the directory location where various files created by the library are stored
    -c, --ConfigPath <path>         This is the directory where the device database resides
    -l, --Logging <bool>            Enable Logging in the Library or not
    -f, --LogFileName <file>        The Log File Name to use (will be output in the UserPath Directory
    -a, --AppendLogFile <bool>      On Restart, should we erase old log files, or append to existing log files
    -s, --SaveLogLevel <level>
    -q, --QueueLogLevel <level>
    -d, --DumpTriggerLevel <level>
    -k, --NetworkKey <key>          Network Key to use for Encrypting Secure Messages over the Network
```

### Commands

```
help [command...]                       Provides help for a given command.
exit                                    Exits application.
controller reset [options] [type]       Reset the controller
node refresh [nodeId]                   Refreshes node information
node list [options]                     Displays list of all nodes

node desc <nodeId>                      Describes the given node
node value [options] <valueId> [value]  Get or set a node value
node loc <nodeId> [loc]                 Get or set the node location
node name <nodeId> [name]               Get or set the node name
node on <nodeId>                        Turns node on
node off <nodeId>                       Turns node off
node level <nodeId> <level>             Sets a nodes level
node watch [nodeId]                     Watch for node events and value changes
record start                            Record the following commands
record stop <file>                      Save the recorded commands to a file
```
