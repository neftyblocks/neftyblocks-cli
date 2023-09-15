"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@oclif/core");
const template_service_1 = require("../../services/template-service");
const BaseCommand_1 = require("../../base/BaseCommand");
const node_1 = tslib_1.__importDefault(require("write-excel-file/node"));
const schema_service_1 = require("../../services/schema-service");
const attributes_utils_1 = require("../../utils/attributes-utils");
const file_utils_1 = require("../../utils/file-utils");
const headers = [
    {
        value: 'template',
    },
    {
        value: 'amount',
    },
    {
        value: 'owner',
    },
];
class GenerateMintMetadataCommand extends BaseCommand_1.BaseCommand {
    async run() {
        const { flags, args } = await this.parse(GenerateMintMetadataCommand);
        const config = await this.getCliConfig();
        const output = args.output;
        const collection = flags.collection;
        const schema = flags.schema;
        const schemas = [];
        const templates = [];
        if ((0, file_utils_1.fileExists)(output)) {
            const proceed = await core_1.ux.confirm('File already exists. Do you want to overwrite it? y/n');
            if (!proceed) {
                this.exit();
            }
        }
        if (schema) {
            core_1.ux.action.start('Getting schema...');
            schemas.push(await (0, schema_service_1.getSchema)(collection, schema, config));
            core_1.ux.action.stop();
            core_1.ux.action.start('Getting templates...');
            templates.push(...(await (0, template_service_1.getTemplatesFromSchema)(collection, schema, config)));
            core_1.ux.action.stop();
        }
        else {
            core_1.ux.action.start('Getting schemas...');
            schemas.push(...(await (0, schema_service_1.getCollectionSchemas)(collection, config)));
            core_1.ux.action.stop();
            core_1.ux.action.start('Getting templates...');
            templates.push(...(await (0, template_service_1.getTemplatesForCollection)(collection, config)));
            core_1.ux.action.stop();
        }
        core_1.ux.action.start('Generating file...');
        await this.generateExcelFile(schemas, templates, output);
        core_1.ux.action.stop();
        this.log(`File generated at ${output}`);
        this.exit();
    }
    async generateExcelFile(schemas, templates, output) {
        const groupedTemplates = Object.fromEntries(schemas.map((schema) => [
            schema.name,
            templates.filter((template) => template.schema.schema_name === schema.name),
        ]));
        const data = schemas.map((schema) => {
            const dataHeaders = schema.format.map((field) => ({
                value: field.name,
            }));
            const schemaHeaders = [...headers, ...dataHeaders];
            const noTemplateRow = [
                {
                    type: String,
                    value: '-1',
                },
                {
                    type: Number,
                    value: 1,
                },
            ];
            const templateRows = groupedTemplates[schema.name].map((template) => [
                {
                    type: String,
                    value: template.template_id,
                },
                {
                    type: Number,
                    value: 1,
                },
                {
                    type: String,
                    value: '',
                },
                ...schema.format.map((field) => ({
                    type: (0, attributes_utils_1.getXlsType)(field.type),
                    value: (0, attributes_utils_1.transformValueToType)(field.type, template.immutable_data[field.name]),
                })),
            ]);
            return [schemaHeaders, noTemplateRow, ...templateRows];
        });
        await (0, node_1.default)(data, {
            sheets: schemas.map((schema) => schema.name),
            filePath: output,
        });
    }
}
GenerateMintMetadataCommand.examples = [
    {
        command: '<%= config.bin %> <%= command.id %> mints.xlsx -c alpacaworlds -s thejourney',
        description: 'Generates the file for the collection alpacaworlds, schema thejourney and saves it in the current directory in a file called mints.xlsx.',
    },
    {
        command: '<%= config.bin %> <%= command.id %> mints.xlsx -c alpacaworlds',
        description: 'Generates the file for the collection alpacaworlds, all schemas and saves it in the current directory in a file called mints.xlsx.',
    },
];
GenerateMintMetadataCommand.description = 'Generates the file to batch mint assets in a collection. Each schema will be a different sheet.';
GenerateMintMetadataCommand.args = {
    output: core_1.Args.file({
        description: 'Location where the file will be generated.',
        required: true,
    }),
};
GenerateMintMetadataCommand.flags = {
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
exports.default = GenerateMintMetadataCommand;
