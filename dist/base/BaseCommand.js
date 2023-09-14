"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = void 0;
const core_1 = require("@oclif/core");
const config_utils_1 = require("../utils/config-utils");
const antelope_service_1 = require("../services/antelope-service");
class BaseCommand extends core_1.Command {
    async getCliConfig(requireSession = true) {
        const config = (0, config_utils_1.readConfiguration)(this.config.configDir);
        if (!config) {
            throw new Error('No configuration file found, please run "config init" command');
        }
        try {
            const session = await (0, antelope_service_1.getSession)(config, requireSession);
            if (!session) {
                throw new Error('No session found, please run "config auth" command');
            }
            return {
                ...config,
                session,
            };
        }
        catch (error) {
            this.log(error.message);
            this.exit();
        }
    }
}
exports.BaseCommand = BaseCommand;
