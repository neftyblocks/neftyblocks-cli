import { MintData } from '../../services/asset-service';
import { Row } from 'read-excel-file/types';
import { AssetSchema } from '../../services/schema-service';
import { CliConfig } from '../../types/cli-config';
import { BaseCommand } from '../../base/BaseCommand';
type MintRow = {
    schema: AssetSchema;
    templateId: string;
    amount: number;
    owner: string;
    mintActionData: MintData;
};
export default class MintCommand extends BaseCommand {
    static description: string;
    static examples: string[];
    static args: {
        input: import("@oclif/core/lib/interfaces/parser").Arg<string, {
            exists?: boolean | undefined;
        }>;
    };
    static flags: {
        batchSize: import("@oclif/core/lib/interfaces").OptionFlag<number, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        collectionName: import("@oclif/core/lib/interfaces").OptionFlag<string, import("@oclif/core/lib/interfaces/parser").CustomOptions>;
        ignoreSupply: import("@oclif/core/lib/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<void>;
    getMintRows(rows: Row[], schema: AssetSchema, config: CliConfig, ignoreSupply?: boolean): Promise<MintRow[]>;
}
export {};
