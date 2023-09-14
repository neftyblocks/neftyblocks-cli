import { AssetSchema } from '../../services/schema-service';
import { TemplateToCreate } from '../../services/template-service';
import { Row } from 'read-excel-file/types';
import { BaseCommand } from '../../base/BaseCommand';
export default class CreateCommand extends BaseCommand {
    static description: string;
    static examples: string[];
    static args: {
        input: import("@oclif/core/lib/interfaces/parser").Arg<string, {
            exists?: boolean | undefined;
        }>;
    };
    static flags: {
        collection: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        batchSize: import("@oclif/core/lib/interfaces").OptionFlag<number, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
    };
    run(): Promise<void>;
    getTemplateToCreate(rows: Row[], schema: AssetSchema): TemplateToCreate[];
}
