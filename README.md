oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![GitHub license](https://img.shields.io/github/license/oclif/hello-world)](https://github.com/oclif/hello-world/blob/main/LICENSE)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g nefty-cli
$ nefty-cli COMMAND
running command...
$ nefty-cli (--version)
nefty-cli/0.0.0 linux-x64 node-v18.16.1
$ nefty-cli --help [COMMAND]
USAGE
  $ nefty-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`nefty-cli hello PERSON`](#nefty-cli-hello-person)
* [`nefty-cli hello world`](#nefty-cli-hello-world)
* [`nefty-cli help [COMMANDS]`](#nefty-cli-help-commands)
* [`nefty-cli plugins`](#nefty-cli-plugins)
* [`nefty-cli plugins:install PLUGIN...`](#nefty-cli-pluginsinstall-plugin)
* [`nefty-cli plugins:inspect PLUGIN...`](#nefty-cli-pluginsinspect-plugin)
* [`nefty-cli plugins:install PLUGIN...`](#nefty-cli-pluginsinstall-plugin-1)
* [`nefty-cli plugins:link PLUGIN`](#nefty-cli-pluginslink-plugin)
* [`nefty-cli plugins:uninstall PLUGIN...`](#nefty-cli-pluginsuninstall-plugin)
* [`nefty-cli plugins:uninstall PLUGIN...`](#nefty-cli-pluginsuninstall-plugin-1)
* [`nefty-cli plugins:uninstall PLUGIN...`](#nefty-cli-pluginsuninstall-plugin-2)
* [`nefty-cli plugins update`](#nefty-cli-plugins-update)

## `nefty-cli hello PERSON`

Say hello

```
USAGE
  $ nefty-cli hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/nefty-galaxy/nefty-cli/blob/v0.0.0/dist/commands/hello/index.ts)_

## `nefty-cli hello world`

Say hello world

```
USAGE
  $ nefty-cli hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ nefty-cli hello world
  hello world! (./src/commands/hello/world.ts)
```

## `nefty-cli help [COMMANDS]`

Display help for nefty-cli.

```
USAGE
  $ nefty-cli help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for nefty-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.10/src/commands/help.ts)_

## `nefty-cli plugins`

List installed plugins.

```
USAGE
  $ nefty-cli plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ nefty-cli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.4.7/src/commands/plugins/index.ts)_

## `nefty-cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ nefty-cli plugins:install PLUGIN...

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
  $ nefty-cli plugins add

EXAMPLES
  $ nefty-cli plugins:install myplugin 

  $ nefty-cli plugins:install https://github.com/someuser/someplugin

  $ nefty-cli plugins:install someuser/someplugin
```

## `nefty-cli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ nefty-cli plugins:inspect PLUGIN...

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
  $ nefty-cli plugins:inspect myplugin
```

## `nefty-cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ nefty-cli plugins:install PLUGIN...

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
  $ nefty-cli plugins add

EXAMPLES
  $ nefty-cli plugins:install myplugin 

  $ nefty-cli plugins:install https://github.com/someuser/someplugin

  $ nefty-cli plugins:install someuser/someplugin
```

## `nefty-cli plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ nefty-cli plugins:link PLUGIN

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
  $ nefty-cli plugins:link myplugin
```

## `nefty-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ nefty-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ nefty-cli plugins unlink
  $ nefty-cli plugins remove
```

## `nefty-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ nefty-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ nefty-cli plugins unlink
  $ nefty-cli plugins remove
```

## `nefty-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ nefty-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ nefty-cli plugins unlink
  $ nefty-cli plugins remove
```

## `nefty-cli plugins update`

Update installed plugins.

```
USAGE
  $ nefty-cli plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
