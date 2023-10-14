import { Command } from '@oclif/core';
import { CliConfig } from '../types';
import { readConfiguration } from '../utils/config-utils';
import { getSession } from '../services/antelope-service';

export abstract class BaseCommand extends Command {
  async catch(error: any) {
    this.log(error.message);
    this.exit();
  }

  async getCliConfig(requireSession = true): Promise<CliConfig> {
    const config = readConfiguration(this.config.configDir);
    if (!config) {
      throw new Error('No configuration file found, please run "config init" command');
    }

    try {
      const session = await getSession(config, requireSession);
      if (!session) {
        throw new Error('No session found, please run "config auth" command');
      }

      return {
        ...config,
        session,
      };
    } catch (error: any) {
      this.log(error.message);
      this.exit();
    }
  }
}
