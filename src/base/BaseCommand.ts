import { Command } from '@oclif/core';
import { CliConfig } from '../types/cli-config';
import { readConfiguration } from '../utils/config-utils';
import { getSession } from '../services/antelope-service';

export abstract class BaseCommand extends Command {
  async getCliConfig(): Promise<CliConfig> {
    const config = readConfiguration(this.config.configDir);
    if (!config) {
      this.log('No configuration file found, please run "config init" command');
      this.exit();
    }

    try {
      const session = await getSession(config.chainId, config.rpcUrl, config.sessionDir);
      return {
        ...config,
        session,
      };
    } catch (error) {
      this.log('No configuration file found, please run "config init" command');
      this.exit();
    }
  }
}
