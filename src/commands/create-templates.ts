import { Command, Flags, ux } from "@oclif/core";
import readXlsxFile from "read-excel-file/node";
import { getCollectionSchemas } from "../antelope/schema-service";
import { TransactResult } from "eosjs/dist/eosjs-api-interfaces";
import { createTemplates } from "../antelope/template-service";
import { Cell } from "read-excel-file/types";
import { getBatchesFromArray } from "../utils/array-utils";
import { decryptConfigurationFile } from "../utils/crypto-utils";
import { fileExists } from "../utils/file-utils";
import { configFileExists } from "../utils/file-utils";

// Required headers
const schemaField = "template_schema";
const maxSupplyField = "template_max_supply";
const isBurnableField = "template_is_burnable";
const isTransferableField = "template_is_transferable";

const typeAliases: any = {
  image: "string",
  ipfs: "string",
};


export default class CreateTemplates extends Command {
  static description = "Create templates in a collection";
  static usage = 'create-templates'

  static examples = [
    "<%= config.bin %> <%= command.id %> -c 1 -f template.xls -s 111",
  ];

  static flags = {
    collection: Flags.string({
      char: "c",
      description: "Collection id",
      required: false,
      default: ''
    }),
    file: Flags.string({
      char: "f",
      description: "Text file with list of addresses",
      required: false,
      default: ''
    }),
    batchSize: Flags.integer({
      char: "s",
      description: "Transactions batch size",
      required: false,
    }),
    password: Flags.string({
      char: "k",
      description: "CLI password",
      default: undefined,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(CreateTemplates);

    if(flags.json === undefined){
      //  this.config.runCommand(this.id!, ['help'])
      this.warn('No flags detected, you can check "create-templates --help" for more information')
      return
    }

    const collection = flags.collection ?? "1";
    const templatesFile = flags.file;
    const batchSize: number = flags.batchSize ?? 10;
    const pwd = flags.password;
    this.debug(`Collection ${collection}`);
    this.debug(`templatesFile ${templatesFile}`);
    this.debug(`batchSize ${batchSize}`);

    // validate CLI password
    ux.action.start("Validating...");
    if(!configFileExists(this.config.configDir)){
      ux.action.stop()
      this.log("No configuration file found, please run config init command");
      this.exit();
    }

    const password = pwd
      ? pwd
      : await ux.prompt("Enter your CLI password", { type: "mask" });
    const config = decryptConfigurationFile(password, this.config.configDir);
    if (!config) {
      ux.action.stop();
      this.log("Invalid password, please try again...");
      this.exit();
    }
    ux.action.stop();

    // Get Schemas
    ux.action.start("Getting collection schemas");
    let schemasMap: Record<string, Record<string, any>> = {};
    try {
      const schemas = await getCollectionSchemas(collection, config);
      schemasMap = Object.fromEntries(
        schemas.map((row) => [row.schema_name, row])
      );
    } catch {
      this.error(`Unable to obtain schemas for collection ${collection}`);
    }

    ux.action.stop();

    // Read XLS file
    ux.action.start("Reading xls file");
    let sheet = [];
    if (fileExists(templatesFile)) {
      try {
        sheet = await readXlsxFile(templatesFile);
      } catch (error) {
        this.warn("Unable to read templates file");
        throw error;
      }
    } else {
      ux.action.stop();
      this.error("XLS file not found!");
    }

    if (sheet.length < 2) {
      ux.action.stop();
      this.error("No entries in the file");
    }

    const headersMap = Object.fromEntries(
      sheet[0]
        .map((name: Cell, index: number) => ({
          name: name.valueOf() as string,
          index,
        }))
        .map((entry: { name: string; index: number }) => [
          entry.name,
          entry.index,
        ])
    );

    const isHeaderPresent = (text: string) => {
      return headersMap[text] >= 0;
    };

    if (
      !isHeaderPresent(schemaField) ||
      !isHeaderPresent(maxSupplyField) ||
      !isHeaderPresent(isBurnableField) ||
      !isHeaderPresent(isTransferableField)
    ) {
      this.error(
        `Headers ${schemaField}, ${maxSupplyField}, ${isBurnableField}, ${isTransferableField} must be present`
      );
    }

    const schemaIndex = headersMap[schemaField];
    const maxSupplyIndex = headersMap[maxSupplyField];
    const isBurnableIndex = headersMap[isBurnableField];
    const isTransferableIndex = headersMap[isTransferableField];

    sheet.splice(0, 1);

    const templates = sheet.map((row: any) => {
      const schemaName: string = (row[schemaIndex] || "").toLowerCase();
      const schema = schemasMap[schemaName];
      if (!schema) {
        this.error(`Schema ${schemaName} doesn't exist`);
      }

      const maxSupply = row[maxSupplyIndex] || 0;
      const isBurnable = Boolean(row[isBurnableIndex]);
      const isTransferable = Boolean(row[isTransferableIndex]);

      if (!isBurnable && !isTransferable) {
        console.error(
          "Non-transferable and non-burnable templates are not supposed to be created"
        );
      }

      const attributes: any[] = [];
      schema.format.forEach((attr: { name: string; type: string }) => {
        const value = row[headersMap[attr.name]];

        // @TODO: do this warning for each schema, not foreach template
        if (headersMap[attr.name] === undefined) {
          this.warn(
            `The attribute: '${attr.name}' of schema: '${schemaName}' is not in any of the columns of the spreadsheet`
          );
        }

        console.log(attr);

        if (value !== null && value !== undefined) {
          const type = typeAliases[attr.type] || attr.type;
          // const type = attr.type
          attributes.push({
            key: attr.name,
            value: [type, value],
          });
        }
      });

      return {
        schema: schemaName,
        maxSupply,
        isBurnable,
        isTransferable,
        immutableAttributes: attributes,
      };
    });
    ux.action.stop();

    // Create Templates
    ux.action.start("Creating Templates...");
    const batches = getBatchesFromArray(templates, batchSize);
    batches.forEach((templatesBatch: any[]) => {
      ux.table(templatesBatch, {
        schema: {
          get: ({ schema }) => schema,
        },
        maxSupply: {
          get: ({ maxSupply }) => maxSupply,
        },
        isBurnable: {
          get: ({ isBurnable }) => isBurnable,
        },
        isTransferable: {
          get: ({ isTransferable }) => isTransferable,
        },
        attributes: {
          get: ({ immutableAttributes }) =>
            <[Map<string, any>]>(
              immutableAttributes
                .map(
                  (map: any) =>
                    `${<Map<string, any>>map.key}: ${<Map<string, any>>(
                      map.value[1]
                    )}`
                )
                .join("\n")
            ),
        },
      });
    });

    let totalCreated = 0;
    const proceed = await ux.confirm("Continue? y/n");
    if (proceed) {
      try {
        for (const templatesBatch of batches) {
          const result = (await createTemplates(
            collection,
            templatesBatch,
            config,
            true
          )) as TransactResult;

          const txId = result.transaction_id;
          this.log(
            `${templatesBatch.length} Templates created successfully. Transaction: ${config.explorerUrl}transaction/${txId}`
          );
          totalCreated += templatesBatch.length;
        }
      } catch (error: any) {
        this.warn(`Error after creating ~${totalCreated}`);
        this.error(error.message);
      }

      ux.action.stop();
      this.log("Done!");
      this.exit(0);
    }
  }
}
