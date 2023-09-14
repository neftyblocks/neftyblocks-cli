"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
const BaseCommand_1 = require("../../base/BaseCommand");
class GetCommand extends BaseCommand_1.BaseCommand {
    async run() {
        const config = await this.getCliConfig(false);
        const params = [];
        const columns = {
            name: {
                get: (row) => {
                    const name = row.name.replace(/([a-z](?=[A-Z]))/g, '$1 ');
                    return name.toLowerCase();
                },
            },
            value: { get: (row) => row.value },
        };
        Object.entries(config).forEach(([key, value]) => {
            var _a;
            if (key === 'session') {
                const session = value;
                params.push({
                    name: 'authenticationMethod',
                    value: ((_a = session.walletPlugin.metadata) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown',
                });
                params.push({
                    name: 'accountName',
                    value: session.actor.toString(),
                });
                params.push({
                    name: 'permission',
                    value: session.permission.toString(),
                });
            }
            else {
                const param = {
                    name: key,
                    value: value,
                };
                params.push(param);
            }
        });
        core_1.ux.table(params, columns);
    }
}
GetCommand.examples = ['<%= config.bin %> <%= command.id %>'];
GetCommand.description = 'Display all the configuration parameters.';
GetCommand.flags = {};
exports.default = GetCommand;
