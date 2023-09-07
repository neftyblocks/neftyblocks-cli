neftyblocks-cli
=================

CLI to manage wax account.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
* [Configuration file](#configuration-file)
* [XLS file](#xls-file)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g neftyblocks-cli
$ nefty COMMAND
running command...
$ nefty (--version)
neftyblocks-cli/0.0.3 darwin-arm64 node-v18.17.1
$ nefty --help [COMMAND]
USAGE
  $ nefty COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`nefty config`](#nefty-config)
* [`nefty config get`](#nefty-config-get)
* [`nefty config init`](#nefty-config-init)
* [`nefty config set`](#nefty-config-set)
* [`nefty create-templates`](#nefty-create-templates)
* [`nefty help [COMMANDS]`](#nefty-help-commands)
* [`nefty mint-assets`](#nefty-mint-assets)
* [`nefty plugins`](#nefty-plugins)
* [`nefty plugins:install PLUGIN...`](#nefty-pluginsinstall-plugin)
* [`nefty plugins:inspect PLUGIN...`](#nefty-pluginsinspect-plugin)
* [`nefty plugins:install PLUGIN...`](#nefty-pluginsinstall-plugin-1)
* [`nefty plugins:link PLUGIN`](#nefty-pluginslink-plugin)
* [`nefty plugins:uninstall PLUGIN...`](#nefty-pluginsuninstall-plugin)
* [`nefty plugins:uninstall PLUGIN...`](#nefty-pluginsuninstall-plugin-1)
* [`nefty plugins:uninstall PLUGIN...`](#nefty-pluginsuninstall-plugin-2)
* [`nefty plugins update`](#nefty-plugins-update)

## `nefty config`

```
USAGE
  $ nefty config
```

_See code: [dist/commands/config/index.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/config/index.ts)_

## `nefty config get`

get a configuration property

```
USAGE
  $ nefty config get [-p <value>] [-k <value>]

FLAGS
  -k, --password=<value>  CLI password
  -p, --property=<value>  Configuration property

DESCRIPTION
  get a configuration property

EXAMPLES
  $ nefty config get
```

## `nefty config init`

Configure credentials

```
USAGE
  $ nefty config init [-n <value>] [-k <value>] [-p <value>] [-j <value>] [-d] [-s]

FLAGS
  -d, --deleteConfig         deletes configuration file
  -j, --permission=<value>   [default: active] account permission
  -k, --privateKey=<value>   private key
  -n, --accountName=<value>  account name
  -p, --password=<value>     CLI password
  -s, --skip                 skip

DESCRIPTION
  Configure credentials

EXAMPLES
  $ nefty config init
```

## `nefty config set`

get a configuration property

```
USAGE
  $ nefty config set [-p <value>] [-k <value>]

FLAGS
  -k, --password=<value>  CLI password
  -p, --property=<value>  Configuration property

DESCRIPTION
  get a configuration property

EXAMPLES
  $ nefty config set
```

## `nefty create-templates`

Create templates in a collection

```
USAGE
  $ nefty create-templates -c <value> -f <value> [-s <value>] [-k <value>]

FLAGS
  -c, --collection=<value>  (required) Collection id
  -f, --file=<value>        (required) Text file with list of addresses
  -k, --password=<value>    CLI password
  -s, --batchSize=<value>   Transactions batch size

DESCRIPTION
  Create templates in a collection

EXAMPLES
  $ nefty create-templates -c 1 -f template.xls -s 111
```

_See code: [dist/commands/create-templates.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/create-templates.ts)_

## `nefty help [COMMANDS]`

Display help for nefty.

```
USAGE
  $ nefty help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for nefty.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.15/src/commands/help.ts)_

## `nefty mint-assets`

Mint assets

```
USAGE
  $ nefty mint-assets -f <value> -c <value> -s <value> [-t <value>] [-i] [-k <value>] [-a]

FLAGS
  -a, --addAttributes           Add Attributes
  -c, --collectionName=<value>  (required) Collection name
  -f, --file=<value>            (required) Excel file with the templates and amounts
  -i, --ignoreSupply            Ignore supply errors
  -k, --password=<value>        CLI password
  -s, --schemaName=<value>      (required) Schema name
  -t, --batchSize=<value>       [default: 100] Transactions batch size

DESCRIPTION
  Mint assets

EXAMPLES
  $ nefty mint-assets -f test.xls -s 1 -i
```

_See code: [dist/commands/mint-assets.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/mint-assets.ts)_

## `nefty plugins`

List installed plugins.

```
USAGE
  $ nefty plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ nefty plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.4.7/src/commands/plugins/index.ts)_

## `nefty plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ nefty plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ nefty plugins add

EXAMPLES
  $ nefty plugins:install myplugin 

  $ nefty plugins:install https://github.com/someuser/someplugin

  $ nefty plugins:install someuser/someplugin
```

## `nefty plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ nefty plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ nefty plugins:inspect myplugin
```

## `nefty plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ nefty plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ nefty plugins add

EXAMPLES
  $ nefty plugins:install myplugin 

  $ nefty plugins:install https://github.com/someuser/someplugin

  $ nefty plugins:install someuser/someplugin
```

## `nefty plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ nefty plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ nefty plugins:link myplugin
```

## `nefty plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ nefty plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ nefty plugins unlink
  $ nefty plugins remove
```

## `nefty plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ nefty plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ nefty plugins unlink
  $ nefty plugins remove
```

## `nefty plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ nefty plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ nefty plugins unlink
  $ nefty plugins remove
```

## `nefty plugins update`

Update installed plugins.

```
USAGE
  $ nefty plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->

<!-- configfile -->

# Configuration file
The neftyblocks-cli requires a configuration that will include all the properties with the information to connect to the proper endpoints.  
You can locate the configuration directory in 

Unix: ~/.config/neftyblocks-cli  
Windows: %LOCALAPPDATA%\neftyblocks-cli  

The required properties are as follows:  


| Property      | Description                                       | Example value |
| --------      | -----------                                       | ------- |
| rpcUrl        | Url that points to your preferred eos node api    | https://wax-testnet.neftyblocks.com |
| atomicUrl     | Url that points to your preferred atomic api      | https://aa-testnet.neftyblocks.com  |
| explorerUrl   | Url that points to your preferred blocks explorer | https://wax-test.bloks.io/  | 
| permission    | Custom permission for template creation           | active  |
| account       | Account name used for any action                  | nefty-example |
| privateKey    | Account private key used to signed transactions   | privateKey-never-share! |

<!-- configfilestop -->


<!-- xlsfile -->
# XLS file
The neftyblocks-cli will read from a XLS template that will contain the schema(s) of the template(s) that we want to create.

This file will have to contain the following headers with the template information:

- template_schema
- template_max_supply
- template_is_burnable
- template_is_transferable

After that we can add the custom attributes for the templates

| template_schema | template_max_supply | template_is_burnable | template_is_transferable | name | image | custom attr1 | custom attr2 | ... |
| -------         | --------            | -------              | -------                  | ------  | ---- | ------| ------| ----- |
| neftyblocks     | 2000                | TRUE/FALSE           |  TRUE/FALSE              | nefty | ipft_hash | custom value1 | custom value2 | ... |
| super.alpaca    | 4000                | TRUE/FALSE           |  TRUE/FALSE              | nefty | ipft_hash | custom value1 | custom value2 | ... |




<!-- xlsfilestop -->
