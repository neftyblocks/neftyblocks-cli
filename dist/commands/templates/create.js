"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@oclif/core");
const node_1 = tslib_1.__importStar(require("read-excel-file/node"));
const schema_service_1 = require("../../services/schema-service");
const template_service_1 = require("../../services/template-service");
const array_utils_1 = require("../../utils/array-utils");
const file_utils_1 = require("../../utils/file-utils");
const attributes_utils_1 = require("../../utils/attributes-utils");
const BaseCommand_1 = require("../../base/BaseCommand");
// Required headers
const maxSupplyField = 'template_max_supply';
const isBurnableField = 'template_is_burnable';
const isTransferableField = 'template_is_transferable';
const typeAliases = {
    image: 'string',
    ipfs: 'string',
    bool: 'uint8',
};
class CreateCommand extends BaseCommand_1.BaseCommand {
    async run() {
        var _a;
        const { flags, args } = await this.parse(CreateCommand);
        const collection = flags.collection;
        const templatesFile = args.input;
        const batchSize = flags.batchSize;
        this.debug(`Collection ${collection}`);
        this.debug(`templatesFile ${templatesFile}`);
        this.debug(`batchSize ${batchSize}`);
        const config = await this.getCliConfig();
        // Get Schemas
        core_1.ux.action.start('Getting collection schemas');
        let schemasMap = {};
        try {
            const schemas = await (0, schema_service_1.getCollectionSchemas)(collection, config);
            schemasMap = Object.fromEntries(schemas.map((row) => [row.name, row]));
        }
        catch {
            this.error(`Unable to obtain schemas for collection ${collection}`);
        }
        core_1.ux.action.stop();
        // Read XLS file
        if (!(0, file_utils_1.fileExists)(templatesFile)) {
            this.error('XLS file not found!');
        }
        core_1.ux.action.start('Reading templates in file');
        const sheetNames = await (0, node_1.readSheetNames)(templatesFile);
        const sheets = await Promise.all(sheetNames.map((name) => (0, node_1.default)(templatesFile, { sheet: name })));
        // Get Templates
        const templates = [];
        for (let i = 0; i < sheetNames.length; i++) {
            const schemaName = sheetNames[i].trim();
            const sheet = sheets[i];
            const schema = schemasMap[schemaName];
            if (!schema) {
                this.error(`Schema ${schemaName} doesn't exist`);
            }
            templates.push(...this.getTemplateToCreate(sheet, schema));
        }
        core_1.ux.action.stop();
        const batches = (0, array_utils_1.getBatchesFromArray)(templates, batchSize);
        batches.forEach((templatesBatch) => {
            core_1.ux.table(templatesBatch, {
                Schema: {
                    get: ({ schema }) => schema,
                },
                'Max Supply': {
                    get: ({ maxSupply }) => (maxSupply > 0 ? maxSupply : '∞'),
                },
                'Burnable?': {
                    get: ({ isBurnable }) => isBurnable,
                },
                'Transferable?': {
                    get: ({ isTransferable }) => isTransferable,
                },
                Attributes: {
                    get: ({ immutableAttributes }) => (immutableAttributes
                        .map((map) => `${map.key}: ${map.value[1]}`)
                        .join('\n')),
                },
            });
        });
        let totalCreated = 0;
        const proceed = await core_1.ux.confirm('Continue? y/n');
        // Create Templates
        core_1.ux.action.start('Creating Templates...');
        if (proceed) {
            try {
                for (const templatesBatch of batches) {
                    const result = (await (0, template_service_1.createTemplates)(collection, templatesBatch, config));
                    const txId = (_a = result.resolved) === null || _a === void 0 ? void 0 : _a.transaction.id;
                    this.log(`${templatesBatch.length} Templates created successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`);
                    totalCreated += templatesBatch.length;
                }
            }
            catch (error) {
                this.warn(`Error after creating ~${totalCreated}`);
                this.error(error.message);
            }
            core_1.ux.action.stop();
            this.exit(0);
        }
    }
    getTemplateToCreate(rows, schema) {
        if (rows.length < 2) {
            this.error(`No entries in the ${schema.name} sheet`);
        }
        const headerRow = rows[0];
        const headersMap = Object.fromEntries(headerRow
            .map((name, index) => ({
            name: name.valueOf(),
            index,
        }))
            .map((entry) => [entry.name, entry.index]));
        const isHeaderPresent = (text) => {
            return headersMap[text] >= 0;
        };
        if (!isHeaderPresent(maxSupplyField) ||
            !isHeaderPresent(isBurnableField) ||
            !isHeaderPresent(isTransferableField)) {
            this.error(`Headers ${maxSupplyField}, ${isBurnableField}, ${isTransferableField} must be present`);
        }
        const maxSupplyIndex = headersMap[maxSupplyField];
        const isBurnableIndex = headersMap[isBurnableField];
        const isTransferableIndex = headersMap[isTransferableField];
        const contentRows = rows.slice(1);
        const templates = contentRows.map((row, index) => {
            const maxSupply = +row[maxSupplyIndex] || 0;
            const isBurnable = Boolean(row[isBurnableIndex]);
            const isTransferable = Boolean(row[isTransferableIndex]);
            if (!isBurnable && !isTransferable) {
                console.error('Non-transferable and non-burnable templates are not supposed to be created');
            }
            for (const header of headerRow) {
                if (header.toString() != maxSupplyField &&
                    header.toString() != isBurnableField &&
                    header.toString() != isTransferableField) {
                    const match = schema.format.some((e) => e.name === header);
                    if (!match)
                        this.warn(`The attribute: '${header.toString()}' is not available in schema: '${schema.name}' in row ${index + 2}`);
                }
            }
            const attributes = [];
            schema.format.forEach((attr) => {
                let value = row[headersMap[attr.name]];
                // @TODO: do this warning for each schema, not foreach template
                if (headersMap[attr.name] === undefined) {
                    this.warn(`The attribute: '${attr.name}' of schema: '${schema.name}' is not in any of the columns of the spreadsheet in row ${index + 2}`);
                }
                if (value !== null && value !== undefined) {
                    const type = typeAliases[attr.type] || attr.type;
                    if (!(0, attributes_utils_1.isValidAttribute)(attr.type, value)) {
                        this.error(`The attribute: '${attr.name}' with value: '${value}' is not of type ${attr.type} for schema: '${schema.name}' in row ${index + 2}`);
                    }
                    else {
                        if (attr.type === 'bool') {
                            value = value ? 1 : 0;
                        }
                    }
                    attributes.push({
                        key: attr.name,
                        value: [type, value],
                    });
                }
            });
            return {
                schema: schema.name,
                maxSupply,
                isBurnable,
                isTransferable,
                immutableAttributes: attributes,
            };
        });
        return templates;
    }
}
CreateCommand.description = 'Create templates in a collection by batches using a spreadsheet.';
CreateCommand.examples = ['<%= config.bin %> <%= command.id %> template.xls -c alpacaworlds'];
CreateCommand.args = {
    input: core_1.Args.file({
        description: 'Excel file with the assets to mint',
        required: true,
    }),
};
CreateCommand.flags = {
    collection: core_1.Flags.string({
        char: 'c',
        description: 'Collection name',
        required: true,
    }),
    batchSize: core_1.Flags.integer({
        char: 'b',
        description: 'Transactions batch size',
        default: 100,
        required: false,
    }),
};
exports.default = CreateCommand;
