import { BaseCommand } from '../../base/BaseCommand';
import { AssetSchema } from '../../services/schema-service';
import { ITemplate } from 'atomicassets/build/API/Explorer/Objects';
export default class GenerateMintMetadataCommand extends BaseCommand {
    static examples: {
        command: string;
        description: string;
    }[];
    static description: string;
    static args: {
        output: import("@oclif/core/lib/interfaces/parser").Arg<string, {
            exists?: boolean | undefined;
        }>;
    };
    static flags: {
        collection: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        schema: import("@oclif/core/lib/interfaces").OptionFlag<string | undefined, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
    };
    run(): Promise<void>;
    generateExcelFile(schemas: AssetSchema[], templates: ITemplate[], output: string): Promise<void>;
}
