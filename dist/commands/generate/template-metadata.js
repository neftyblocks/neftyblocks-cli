"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@oclif/core");
const BaseCommand_1 = require("../../base/BaseCommand");
const node_1 = tslib_1.__importDefault(require("write-excel-file/node"));
const schema_service_1 = require("../../services/schema-service");
const attributes_utils_1 = require("../../utils/attributes-utils");
const file_utils_1 = require("../../utils/file-utils");
const headers = [
    {
        value: 'template_max_supply',
    },
    {
        value: 'template_is_burnable',
    },
    {
        value: 'template_is_transferable',
    },
];
class GenerateTemplateMetadataCommand extends BaseCommand_1.BaseCommand {
    async run() {
        const { flags, args } = await this.parse(GenerateTemplateMetadataCommand);
        const config = await this.getCliConfig();
        const output = args.output;
        const collection = flags.collection;
        const schema = flags.schema;
        const schemas = [];
        if ((0, file_utils_1.fileExists)(output)) {
            const proceed = await core_1.ux.confirm('File already exists. Do you want to overwrite it?');
            if (!proceed) {
                this.exit();
            }
        }
        if (schema) {
            core_1.ux.action.start('Getting schema...');
            schemas.push(await (0, schema_service_1.getSchema)(collection, schema, config));
            core_1.ux.action.stop();
        }
        else {
            core_1.ux.action.start('Getting schemas...');
            schemas.push(...(await (0, schema_service_1.getCollectionSchemas)(collection, config)));
            core_1.ux.action.stop();
        }
        core_1.ux.action.start('Generating file...');
        await this.generateExcelFile(schemas, output);
        core_1.ux.action.stop();
        this.log(`File generated at ${output}`);
        this.exit();
    }
    async generateExcelFile(schemas, output) {
        const data = schemas.map((schema) => {
            const dataHeaders = schema.format.map((field) => ({
                value: field.name,
            }));
            const schemaHeaders = [...headers, ...dataHeaders];
            const exampleRow = [
                {
                    type: Number,
                    value: 0,
                },
                {
                    type: Boolean,
                    value: true,
                },
                {
                    type: Boolean,
                    value: true,
                },
                ...schema.format.map((field) => ({
                    type: (0, attributes_utils_1.getXlsType)(field.type),
                    value: undefined,
                })),
            ];
            return [schemaHeaders, exampleRow];
        });
        await (0, node_1.default)(data, {
            sheets: schemas.map((schema) => schema.name),
            filePath: output,
        });
    }
}
GenerateTemplateMetadataCommand.examples = [
    {
        command: '<%= config.bin %> <%= command.id %> templates.xlsx -c alpacaworlds -s thejourney',
        description: 'Generates the file for the collection alpacaworlds, schema thejourney and saves it in the current directory in a file called templates.xlsx.',
    },
    {
        command: '<%= config.bin %> <%= command.id %> templates.xlsx -c alpacaworlds',
        description: 'Generates the file for the collection alpacaworlds, all schemas and saves it in the current directory in a file called templates.xlsx.',
    },
];
GenerateTemplateMetadataCommand.description = 'Generates the file to batch create templates in a collection. Each schema will be a different sheet.';
GenerateTemplateMetadataCommand.args = {
    output: core_1.Args.file({
        description: 'Location where the file will be generated.',
        required: true,
    }),
};
GenerateTemplateMetadataCommand.flags = {
    collection: core_1.Flags.string({
        char: 'c',
        description: 'Collection name to generate the file.',
        required: true,
    }),
    schema: core_1.Flags.string({
        char: 's',
        description: 'Schema to use to generate the file. If not provided, all schemas will be used.',
    }),
};
exports.default = GenerateTemplateMetadataCommand;
