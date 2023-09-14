"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const core_1 = require("@oclif/core");
const node_1 = tslib_1.__importStar(require("read-excel-file/node"));
const asset_service_1 = require("../../services/asset-service");
const template_service_1 = require("../../services/template-service");
const array_utils_1 = require("../../utils/array-utils");
const file_utils_1 = require("../../utils/file-utils");
const schema_service_1 = require("../../services/schema-service");
const attributes_utils_1 = require("../../utils/attributes-utils");
const BaseCommand_1 = require("../../base/BaseCommand");
const templateField = 'template';
const amountField = 'amount';
const ownerField = 'owner';
class MintCommand extends BaseCommand_1.BaseCommand {
    async run() {
        var _a;
        const { flags, args } = await this.parse(MintCommand);
        const mintsFile = args.input;
        const batchSize = flags.batchSize;
        const ignoreSupply = flags.ignoreSupply;
        const collectionName = flags.collectionName;
        const config = await this.getCliConfig();
        core_1.ux.action.start('Getting collection schemas');
        const schema = await (0, schema_service_1.getCollectionSchemas)(collectionName, config);
        const schemasMap = Object.fromEntries(schema.map((row) => [row.name, row]));
        core_1.ux.action.stop();
        // Read XLS file
        if (!(0, file_utils_1.fileExists)(mintsFile)) {
            this.error('XLS file not found!');
        }
        core_1.ux.action.start('Reading mints in file');
        const sheetNames = await (0, node_1.readSheetNames)(mintsFile);
        const sheets = await Promise.all(sheetNames.map((name) => (0, node_1.default)(mintsFile, { sheet: name })));
        const mintRows = [];
        for (let i = 0; i < sheetNames.length; i++) {
            const sheet = sheets[i];
            const schemaName = sheetNames[i].trim();
            const schema = schemasMap[schemaName];
            mintRows.push(...(await this.getMintRows(sheet, schema, config, ignoreSupply)));
        }
        core_1.ux.action.stop();
        // Create table columns and print table
        const columns = {
            schema: { get: (row) => row.mintActionData.schema_name },
            'Template Id': { get: (row) => row.mintActionData.template_id },
            owner: { get: (row) => row.mintActionData.new_asset_owner },
            amount: { get: (row) => row.amount },
            attributes: {
                get: (row) => row.mintActionData.immutable_data
                    .map((map) => `${map.key}: ${map.value[1]}`)
                    .join('\n'),
            },
        };
        core_1.ux.table(mintRows, columns);
        const proceed = await core_1.ux.confirm('Continue? y/n');
        if (!proceed)
            return;
        core_1.ux.action.start('Minting assets...');
        const mintActions = [];
        for (const mint of mintRows) {
            for (let i = 0; i < mint.amount; i++) {
                mintActions.push(mint.mintActionData);
            }
        }
        const actionBatches = (0, array_utils_1.getBatchesFromArray)(mintActions, batchSize);
        let totalMintCount = 0;
        try {
            for (const mintActions of actionBatches) {
                const result = (await (0, asset_service_1.mintAssets)(mintActions, config));
                const txId = (_a = result.resolved) === null || _a === void 0 ? void 0 : _a.transaction.id;
                this.log(`${mintActions.length} Assets minted successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`);
                {
                    const templateAmountMap = {};
                    for (const mintAction of mintActions) {
                        if (templateAmountMap[mintAction.template_id.toString()] === undefined) {
                            templateAmountMap[mintAction.template_id.toString()] = 1;
                        }
                        else {
                            templateAmountMap[mintAction.template_id.toString()] += 1;
                        }
                    }
                    for (const templateId in templateAmountMap) {
                        this.log(`    minted ${templateAmountMap[templateId]} of template ${templateId}`);
                    }
                }
                totalMintCount += mintActions.length;
            }
        }
        catch (error) {
            this.error(`ERROR after minting: ${totalMintCount} successfully\n` + error);
        }
        core_1.ux.action.stop();
        this.exit(0);
    }
    async getMintRows(rows, schema, config, ignoreSupply = false) {
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
        if (!isHeaderPresent(templateField) || !isHeaderPresent(amountField)) {
            this.error(`Headers ${templateField}, ${amountField} must be present`);
        }
        const contentRows = rows.slice(1);
        const templateIndex = headersMap[templateField];
        const amountIndex = headersMap[amountField];
        const ownerIndex = headersMap[ownerField];
        const templateIds = contentRows.map((row, index) => {
            const templateId = row[templateIndex];
            if (!templateId) {
                this.error(`Error in row: ${index + 2} Template is required`);
            }
            return templateId;
        });
        core_1.ux.action.start('Checking Templates...');
        const templatesMap = await (0, template_service_1.getTemplatesMap)(templateIds, config);
        const mintedCounts = {};
        core_1.ux.action.stop();
        const mints = [];
        contentRows.forEach((row, index) => {
            const templateId = row[templateIndex];
            const template = templatesMap[templateId];
            const owner = row[ownerIndex];
            let amount = row[amountIndex];
            if (amount) {
                amount = row[amountIndex];
            }
            if (!template && templateId !== '-1') {
                this.error(`Template ${templateId} doesn't exist`);
            }
            if (isNaN(amount) || amount <= 0) {
                this.error('Amount must be greater than 0');
            }
            if (!owner) {
                this.error('Owner is required');
            }
            const inmutableData = (template === null || template === void 0 ? void 0 : template.immutable_data) || {};
            const attributes = [];
            schema.format.forEach((attr) => {
                let value = row[headersMap[attr.name]];
                if (headersMap[attr.name] === undefined) {
                    this.warn(`The attribute: '${attr.name}' of schema: '${schema.name}' is not in any of the columns of the spreadsheet in row ${index + 2}`);
                }
                if (value !== null && value !== undefined) {
                    if (attr.name in inmutableData) {
                        this.warn(`Schema contains attribute "${attr.name}" with value: "${value}", ignoring attribute from spreadsheet in row ${index + 2}`);
                        return;
                    }
                    const type = attributes_utils_1.typeAliases[attr.type] || attr.type;
                    if (!(0, attributes_utils_1.isValidAttribute)(attr.type, value)) {
                        this.warn(`The attribute: '${attr.name}' with value: '${value}' is not of type ${attr.type} for schema: '${schema.name}' in row ${index + 2}`);
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
            // to check if the template has enough max supply we must be mindful of the
            // fact that the same template could be in two different rows, to solve this
            // we use the template map to store how many assets of each template will
            // be minted after going thru all the rows
            if (mintedCounts[templateId] === undefined) {
                mintedCounts[templateId] = 0;
            }
            mintedCounts[templateId] += amount;
            if (parseInt((template === null || template === void 0 ? void 0 : template.max_supply) || '0', 10) !== 0 &&
                mintedCounts[templateId] + parseInt(template.issued_supply, 10) > parseInt(template.max_supply, 10)) {
                if (ignoreSupply) {
                    const remainingSupply = Number(template.max_supply) - Number(template.issued_supply);
                    if (amount > remainingSupply && remainingSupply > 0) {
                        amount = remainingSupply;
                    }
                    else {
                        return;
                    }
                }
                else {
                    this.log('Template', template);
                    this.error(`Template ${templateId} doesn't have enough max supply to mint in row ${index + 2}`);
                }
            }
            mints.push({
                templateId,
                amount: amount,
                owner,
                mintActionData: {
                    authorized_minter: config.session.actor,
                    collection_name: schema.collectionName,
                    schema_name: schema.name,
                    template_id: templateId,
                    new_asset_owner: owner,
                    immutable_data: attributes.length > 0 ? attributes : [],
                    mutable_data: [],
                    tokens_to_back: [],
                },
            });
        });
        return mints;
    }
}
MintCommand.description = 'Mints assets in batches using a spreadsheet.';
MintCommand.examples = ['<%= config.bin %> <%= command.id %> test.xls -c alpacaworlds'];
MintCommand.args = {
    input: core_1.Args.file({
        description: 'Excel file with the templates and amounts',
        required: true,
    }),
};
MintCommand.flags = {
    batchSize: core_1.Flags.integer({
        char: 'b',
        description: 'Transactions batch size',
        required: false,
        default: 100,
    }),
    collectionName: core_1.Flags.string({
        char: 'c',
        description: 'Collection name',
        required: true,
    }),
    ignoreSupply: core_1.Flags.boolean({
        char: 'i',
        description: 'Ignore supply errors',
        default: false,
    }),
};
exports.default = MintCommand;
