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
neftyblocks-cli/0.0.3 darwin-arm64 node-v18.12.1
$ nefty --help [COMMAND]
USAGE
  $ nefty COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`nefty assets`](#nefty-assets)
* [`nefty assets mint`](#nefty-assets-mint)
* [`nefty config`](#nefty-config)
* [`nefty config get`](#nefty-config-get)
* [`nefty config init`](#nefty-config-init)
* [`nefty config set [PROPERTY] [VALUE]`](#nefty-config-set-property-value)
* [`nefty help [COMMANDS]`](#nefty-help-commands)
* [`nefty templates`](#nefty-templates)
* [`nefty templates create`](#nefty-templates-create)

## `nefty assets`

Manages a collection's assets.

```
USAGE
  $ nefty assets

DESCRIPTION
  Manages a collection's assets.
```

_See code: [dist/commands/assets/index.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/assets/index.ts)_

## `nefty assets mint`

Mints assets in batches using a spreadsheet.

```
USAGE
  $ nefty assets mint -f <value> -c <value> -s <value> [-k <value>] [-t <value>] [-i] [-a]

FLAGS
  -a, --addAttributes           Add Attributes
  -c, --collectionName=<value>  (required) Collection name
  -f, --file=<value>            (required) Excel file with the templates and amounts
  -i, --ignoreSupply            Ignore supply errors
  -k, --password=<value>        CLI password
  -s, --schemaName=<value>      (required) Schema name
  -t, --batchSize=<value>       [default: 100] Transactions batch size

DESCRIPTION
  Mints assets in batches using a spreadsheet.

EXAMPLES
  $ nefty assets mint -f test.xls -s 1 -i
```

_See code: [dist/commands/assets/mint.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/assets/mint.ts)_

## `nefty config`

Manages the configuration.

```
USAGE
  $ nefty config

DESCRIPTION
  Manages the configuration.
```

_See code: [dist/commands/config/index.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/config/index.ts)_

## `nefty config get`

Display all the configuration parameters.

```
USAGE
  $ nefty config get [-k <value>]

FLAGS
  -k, --password=<value>  CLI password

DESCRIPTION
  Display all the configuration parameters.

EXAMPLES
  $ nefty config get
```

_See code: [dist/commands/config/get.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/config/get.ts)_

## `nefty config init`

Configure the parameters to interact with the blockchain.

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
  Configure the parameters to interact with the blockchain.

EXAMPLES
  $ nefty config init
```

_See code: [dist/commands/config/init.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/config/init.ts)_

## `nefty config set [PROPERTY] [VALUE]`

Get a configuration property

```
USAGE
  $ nefty config set [PROPERTY] [VALUE] [-k <value>]

ARGUMENTS
  PROPERTY  (explorerUrl|rpcUrl|atomicUrl|account|permission|privateKey) Configuration property.
  VALUE     Configuration value.

FLAGS
  -k, --password=<value>  CLI password

DESCRIPTION
  Get a configuration property

EXAMPLES
  Sets the explorer url property

    $ nefty config set explorerUrl https://waxblock.io
```

_See code: [dist/commands/config/set.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/config/set.ts)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.19/src/commands/help.ts)_

## `nefty templates`

Manages a collection's templates.

```
USAGE
  $ nefty templates

DESCRIPTION
  Manages a collection's templates.
```

_See code: [dist/commands/templates/index.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/templates/index.ts)_

## `nefty templates create`

Create templates in a collection by batches using a spreadsheet.

```
USAGE
  $ nefty templates create -c <value> -f <value> [-k <value>] [-s <value>]

FLAGS
  -c, --collection=<value>  (required) Collection id
  -f, --file=<value>        (required) Text file with list of addresses
  -k, --password=<value>    CLI password
  -s, --batchSize=<value>   Transactions batch size

DESCRIPTION
  Create templates in a collection by batches using a spreadsheet.

EXAMPLES
  $ nefty templates create -c alpacaworlds -s thejourney -f template.xls
```

_See code: [dist/commands/templates/create.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/templates/create.ts)_
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
| explorerUrl   | Url that points to your preferred blocks explorer | https://wax-test.bloks.io  | 
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
