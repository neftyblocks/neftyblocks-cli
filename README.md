neftyblocks-cli
=================

CLI to manage wax account.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g neftyblocks-cli
$ nefty COMMAND
running command...
$ nefty (--version)
neftyblocks-cli/0.0.1 linux-x64 node-v18.16.1
$ nefty --help [COMMAND]
USAGE
  $ nefty COMMAND
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`nefty config init`](#nefty-config-init)
* [`nefty config get`](#nefty-config-get)
* [`nefty config set`](#nefty-config-set)
* [`nefty create-templates`](#nefty-create-templates)


## `nefty config init`

Creates a protected configuration file with the required credentials

```
USAGE
  $ nefty config init

ARGUMENTS
  -d, --deleteConfig              Deletes any CLI configuration file
  -n, --accountName=accountName   Account Name to be used 
  -k, --privateKey=privateKey     Account Private Key
  -p, --password=password         Password to protect your configuration file
  -j, --permission=active         Custom permission name (defaults to active)
  
EXAMPLES
  $ nefty config init
  Checking for configuration file... ?
  Enter your account name: nefty-example
  Enter your private key: ****
  Enter your CLI password: ******
  Creating configuration file...

  $ nefty config init -n nefty-example -k supersecretprivatekeydonotshare -p myclipassword
  Checking for configuration file... ?
  Creating configuration file...

  $ nefty config init -d
  Are you sure you want to delete the configuration file? y/n: y
  Deleting configuration file...... done
  Configuration file deleted!

```

_See code: [dist/commands/hello/index.ts](https://github.com/neftyblocks/neftyblocks-cli/blob/v0.1.0/dist/commands/config/index.ts)_

## `nefty config get`

Gets a specific property from the configuration

```
USAGE
  $ nefty config get -p account

ARGUMENTS
  -p, --parameter=account         Configuration property to get value
  
EXAMPLES
  $ nefty config get -p account
  Enter your CLI password: ******
  account: nefty-example  
```

_See code: [dist/commands/hello/index.ts](https://github.com/neftyblocks/neftyblocks-cli/blob/v0.1.0/dist/commands/config/index.ts)_


## `nefty config set`

Sets the value of a specific property from the configuration

```
USAGE
  $ nefty config set -p account=my-new-account-value

ARGUMENTS
  -p, --parameter=account         Configuration property to set
  
EXAMPLES
  $ nefty config set -p account=root-nefty
  Enter your CLI password: ******
  Checking configurations...... done
  Updating configurations...... done
  Update completed!!
```

_See code: [dist/commands/hello/index.ts](https://github.com/neftyblocks/neftyblocks-cli/blob/v0.1.0/dist/commands/config/index.ts)_


## `nefty create-templates`

Create templates in a collection

```
USAGE
  $ nefty create-templates

ARGUMENTS
  -c, --collection=collection  (required) Collection id
  -f, --file=file              (required) xls file with template schema 
  -s, --batchSize=batchSize    Transactions batch size

EXAMPLES
  $ nefty create-templates -c neftyCollection -f /path/to/template.xls
  Enter your CLI password: ****
  Getting collection schemas... done
  Reading xls file... done
  Creating Templates...... ?
  Continue? y/n: y
  ...
```

_See code: [dist/commands/hello/index.ts](https://github.com/neftyblocks/neftyblocks-cli/blob/v0.1.0/dist/commands/hello/index.ts)_

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

