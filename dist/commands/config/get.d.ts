import { BaseCommand } from '../../base/BaseCommand';
export default class GetCommand extends BaseCommand {
    static examples: string[];
    static description: string;
    static flags: {};
    run(): Promise<void>;
}
