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
* [`nefty create-templates`](#nefty-create-templates)


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
  Getting collection schemas... done
  Reading xls file... done
  Creating Templates......
```

_See code: [dist/commands/hello/index.ts](https://github.com/neftyblocks/neftyblocks-cli/blob/v0.1.0/dist/commands/hello/index.ts)_

<!-- commandsstop -->

<!-- configfile -->

# Configuration file
The neftyblocks-cli requires a configuration that will include all the properties with the information to connect to the proper endpoints.  
The configuration file is located at  `config/default.json`   

If you downloaded the neftyblocks-cli from npm you can locate the configuration directory in 

Unix: ~/.config/neftyblocks-cli  
Windows: %LOCALAPPDATA%\neftyblocks-cli  

Can be overridden with ```XDG_CONFIG_HOME``` as an env var


The required properties are as follows:  


| Property      | Description                                       | Example value |
| --------      | -----------                                       | ------- |
| eosUrl        | Url that points to your preferedeos node api      | https://wax-testnet.neftyblocks.com |
| atomicUrl     | Url that points to your preferedatomic api        | https://aa-testnet.neftyblocks.com  |
| ipfsUrl       | Url that points to your prefered ipfs             | https://ipfs-gateway.pink.gg  |
| bloksUrl      | Url that points to your prefered blocks explorer  | https://wax-test.bloks.io/  | 
| atomicHubUrl  | Url that points to atomichub                      | https://wax-test.atomichub.io |
| hyperionUrl   | Url that points to your prefered hyperion api     | https://wax.greymass.com  |
| account       | The account name to be used                       | nefty |
| privateKey    | The account private key                           | NeftyAccountSecretKey |
| lightApiUrl   | Url that points to ligthApi                       | https://wax.light-api.net |


### Fixed Values (Do not change)
| Property      | Description                                       | Value   |
| --------      | -----------                                       | ------- |
| permission    | Contract Permission                               | active  |
| packsContract | NeftyBlocks Contract Name for Packs               | neftyblocksp  |
| blendsContract  | NeftyBlocks Contract Name for Blends            | blend.nefty |
| proposerAccount | NeftyBlocks proposer account name                | nefty |
| proposerPermission | NeftyBlocks permission for proposer contract | nefty |


Be sure to properly indicate the ```account``` and the ```privateKey``` properties, this will allow the CLI to perform the required transactions for the creation of the templates.



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




<!-- xlsfilestop -->

