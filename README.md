neftyblocks-cli
=================

Neftyblocks-cli is a tool that will help you manage your collections by creating templates and minting assests.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
* [Configuration file](#configuration-file)
* [XLS file](#xls-file)
<!-- tocstop -->

<!-- requirements -->
# Requirements  

Neftyblocks-cli asks for the following minimum requirements installed:

-  Node.js [v18.x](https://nodejs.org/download/release/latest-v18.x/)  (A little Installation [guide](https://nodejs.dev/en/learn/how-to-install-nodejs/))

<!-- requirementsstop -->

<!-- installation -->
# Installation

To install the Neftyblocks-CLI you can run the following command:

```
npm install -g neftyblocks-cli
```

This will download and install the CLI, after its installed you can quickly start by [configuring](#nefty-config-init) your CLI settings

<!-- installationstop -->

<!-- usage -->
# Usage

You will quickly learn your ways through the Neftyblocks-CLI, it is really easy and intuitive. 
You just need to type `nefty` and the command and actions you want to run. 

```sh-session
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

<!-- initialize -->
# Configuration
Neftyblocks-CLI works based on a configuration file that you will need to generate first. 
This file contains the urls and defined values to be able to communicate with the Chain.
In order to generate this configuration you will need to run the following command:

```
nefty config init
```

Then you will be prompt/asked to enter the required information. 
<!-- initializestop -->

<!-- configfile -->

## Configuration file
The neftyblocks-cli requires a configuration that will include all the properties with the information to connect to the proper endpoints.  
You can locate the configuration directory in 

Unix: ~/.config/nefty/config.json
Windows: %LOCALAPPDATA%\nefty\config.json

Be aware that this file will be encrypted to keep your data safe. 

The required properties are as follows:  


| Property      | Description                                       | Example value |
| --------      | -----------                                       | ------- |
| rpcUrl        | Url that points to your preferred eos node api    | https://wax-testnet.neftyblocks.com |
| aaUrl     | Url that points to your preferred atomic assets api      | https://aa-testnet.neftyblocks.com  |
| explorerUrl   | Url that points to your preferred blocks explorer | https://wax-test.bloks.io  | 
| permission    | Custom permission for template creation           | active  |
| account       | Account name used for any action                  | superuser |
| privateKey    | Account private key used to signed transactions   | privateKey-never-share! |

<!-- configfilestop -->


<!-- quickstart -->
# Quick Start

Neftyblocks-CLI is able to create templates and mint assets based on xls templates that contains the required informations. 
The required parameters are the collection name and the path where the file will be downloaded. If no schema is passed to the command it will retrieve all available schemas for the collection and place them one per sheet inside the xls file
You can also filter by schema in case you just want to work based on 1 schema
You can generate and download these templates by running the following commands:

## Generate XLS Template for Template Creation
```
nefty generate template-metadata ~/Downloads/template-file-path -c yourCollectionName -s yourSchemaName
```

## Generate XLS Template for Minting Assets
```
nefty generate mint-metadata ~/Downloads/mint-file-path -c yourCollectionName -s yourSchemaName
```

## Create Templates

You can create your templates by running the following command:
```
nefty templates create ~/path/to/xls/file -c collectionName
```

## Mint Assets

You can mint NFTs by running the following command:

```
nefty assets mint ~/path/to/xls/file -c collectionName
```

<!-- quickstartstop -->

<!-- xlsfile -->
# XLS file
The neftyblocks-cli will read from a XLS template that will contain the schema(s) of the template(s) that we want to create.

This file will have to contain the following headers with the template information:


| Header | Description|
| ----  | ---- |
| template_schema | The name of the Schema to be used for the templates |
| template_max_supply | The amount of assets that will be available to mint for this template (0 means infinite supply) |
| template_is_burnable | Indicates if you will be able to burn your assets |
| template_is_transferable | Indicates if you can transfer your assets to another account |
| template | template Id or Number to be used when minting (-1 can be used if no template is required) |
| amount | Number of NFTs to be minted |
| owner | The owner of the collection |   



After that we can add the custom attributes for the templates

| template_schema | template_max_supply | template_is_burnable | template_is_transferable | name | image | custom attr1 | custom attr2 | ... |
| -------         | --------            | -------              | -------                  | ------  | ---- | ------| ------| ----- |
| neftyblocks     | 2000                | TRUE/FALSE           |  TRUE/FALSE              | nefty | ipfs_hash | custom value1 | custom value2 | ... |
| super.alpaca    | 4000                | TRUE/FALSE           |  TRUE/FALSE              | nefty | ipfs_hash | custom value1 | custom value2 | ... |

<!-- xlsfilestop -->


# Commands
<!-- commands -->
The Neftyblocks-CLI includes the following commands and actions:

* [`nefty assets`](#nefty-assets)
* [`nefty assets mint INPUT`](#nefty-assets-mint-input)
* [`nefty config`](#nefty-config)
* [`nefty config get`](#nefty-config-get)
* [`nefty config init`](#nefty-config-init)
* [`nefty config set [PROPERTY] [VALUE]`](#nefty-config-set-property-value)
* [`nefty generate`](#nefty-generate)
* [`nefty generate mint-metadata OUTPUT`](#nefty-generate-mint-metadata-output)
* [`nefty generate template-metadata OUTPUT`](#nefty-generate-template-metadata-output)
* [`nefty help [COMMANDS]`](#nefty-help-commands)
* [`nefty templates`](#nefty-templates)
* [`nefty templates create INPUT`](#nefty-templates-create-input)

## `nefty assets`

Manages a collection's assets.

```
USAGE
  $ nefty assets

DESCRIPTION
  Manages a collection's assets.
```

_See code: [dist/commands/assets/index.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/assets/index.ts)_

## `nefty assets mint INPUT`

Mints assets in batches using a spreadsheet.

```
USAGE
  $ nefty assets mint INPUT -c <value> [-k <value>] [-t <value>] [-i] [-a]

ARGUMENTS
  INPUT  Excel file with the templates and amounts

FLAGS
  -a, --addAttributes           Add Attributes
  -c, --collectionName=<value>  (required) Collection name
  -i, --ignoreSupply            Ignore supply errors
  -k, --password=<value>        CLI password
  -t, --batchSize=<value>       [default: 100] Transactions batch size

DESCRIPTION
  Mints assets in batches using a spreadsheet.

EXAMPLES
  $ nefty assets mint test.xls -c alpacaworlds
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
  -s, --skip                 skip the configuration by using the default values

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
  PROPERTY  (explorerUrl|rpcUrl|aaUrl|account|permission|privateKey) Configuration property.
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

## `nefty generate`

Generates files to use in other batch commands.

```
USAGE
  $ nefty generate

DESCRIPTION
  Generates files to use in other batch commands.
```

_See code: [dist/commands/generate/index.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/generate/index.ts)_

## `nefty generate mint-metadata OUTPUT`

Generates the file to batch mint assets in a collection. Each schema will be a different sheet.

```
USAGE
  $ nefty generate mint-metadata OUTPUT -c <value> [-s <value>]

ARGUMENTS
  OUTPUT  Location where the file will be generated.

FLAGS
  -c, --collection=<value>  (required) Collection to filter the assets.
  -s, --schema=<value>      Schema to filter the assets.

DESCRIPTION
  Generates the file to batch mint assets in a collection. Each schema will be a different sheet.

EXAMPLES
  Generates the file for the collection alpacaworlds, schema thejourney and saves it in the current directory in a
  file called mints.xlsx.

    $ nefty generate mint-metadata mints.xlsx -c alpacaworlds -s thejourney

  Generates the file for the collection alpacaworlds, all schemas and saves it in the current directory in a file
  called mints.xlsx.

    $ nefty generate mint-metadata mints.xlsx -c alpacaworlds
```

_See code: [dist/commands/generate/mint-metadata.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/generate/mint-metadata.ts)_

## `nefty generate template-metadata OUTPUT`

Generates the file to batch create templates in a collection. Each schema will be a different sheet.

```
USAGE
  $ nefty generate template-metadata OUTPUT -c <value> [-s <value>]

ARGUMENTS
  OUTPUT  Location where the file will be generated.

FLAGS
  -c, --collection=<value>  (required) Collection to filter the assets.
  -s, --schema=<value>      Schema to filter the assets.

DESCRIPTION
  Generates the file to batch create templates in a collection. Each schema will be a different sheet.

EXAMPLES
  Generates the file for the collection alpacaworlds, schema thejourney and saves it in the current directory in a
  file called templates.xlsx.

    $ nefty generate template-metadata templates.xlsx -c alpacaworlds -s thejourney

  Generates the file for the collection alpacaworlds, all schemas and saves it in the current directory in a file
  called templates.xlsx.

    $ nefty generate template-metadata templates.xlsx -c alpacaworlds
```

_See code: [dist/commands/generate/template-metadata.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/generate/template-metadata.ts)_

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

## `nefty templates create INPUT`

Create templates in a collection by batches using a spreadsheet.

```
USAGE
  $ nefty templates create INPUT -c <value> [-k <value>] [-s <value>]

ARGUMENTS
  INPUT  Excel file with the assets to mint

FLAGS
  -c, --collection=<value>  (required) Collection id
  -k, --password=<value>    CLI password
  -s, --batchSize=<value>   [default: 100] Transactions batch size

DESCRIPTION
  Create templates in a collection by batches using a spreadsheet.

EXAMPLES
  $ nefty templates create template.xls -c alpacaworlds -s thejourney
```

_See code: [dist/commands/templates/create.ts](https://github.com/neftyblocks/nefty-cli/blob/v0.0.3/dist/commands/templates/create.ts)_
<!-- commandsstop -->





