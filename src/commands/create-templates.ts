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
import { isValidAttribute } from "../utils/attributes-utils";

// Required headers
const schemaField = "template_schema";
const maxSupplyField = "template_max_supply";
const isBurnableField = "template_is_burnable";
const isTransferableField = "template_is_transferable";

const typeAliases: any = {
  image: "string",
  ipfs: "string",
  bool: 'uint8'
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
      required: true,
    }),
    file: Flags.string({
      char: "f",
      description: "Text file with list of addresses",
      required: true,
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

    const collection = flags.collection ?? "1";
    const templatesFile = flags.file;
    const batchSize: number = flags.batchSize ?? 10;
    const pwd = flags.password;
    this.debug(`Collection ${collection}`);
    this.debug(`templatesFile ${templatesFile}`);
    this.debug(`batchSize ${batchSize}`);

    // validate CLI password
    if(!configFileExists(this.config.configDir)){
      ux.action.stop()
      this.log("No configuration file found, please run 'config init' command");
      this.exit();
    }

    const password = pwd
      ? pwd
      : await ux.prompt("Enter your CLI password", { type: "mask" });
    const config = decryptConfigurationFile(password, this.config.configDir);
    if (!config) {
      this.log("Invalid password, please try again...");
      this.exit();
    }

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

    const headersMap: {[key:string]:number} = Object.fromEntries(
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
    
    ux.action.stop();

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

    const headers = sheet[0]
    sheet.splice(0, 1);

    const templates = sheet.map((row: any, index: number) => {
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

      for(const header of headers){
        if(header.toString() != schemaField && 
          header.toString() != maxSupplyField && 
          header.toString() != isBurnableField &&
          header.toString() != isTransferableField
        ){
          const match = schema.format.some((e: { name: string | number | boolean | DateConstructor; }) => e.name === header)
          if (!match) this.warn(
            `The attribute: '${header.toString()}' is not available in schema: '${schemaName} in line ${index+2}'`
          );
        }
      }
      
      const attributes: any[] = [];
      schema.format.forEach((attr: { name: string; type: string }) => {
        let value = row[headersMap[attr.name]];
        // @TODO: do this warning for each schema, not foreach template
        if (headersMap[attr.name] === undefined) {
          this.warn(
            `The attribute: '${attr.name}' of schema: '${schemaName}' is not in any of the columns of the spreadsheet in line ${index+2}`
          );
        }
        if (value !== null && value !== undefined) {
          const type = typeAliases[attr.type] || attr.type;
          if(!isValidAttribute(attr.type, value)){
            this.warn(`The attribute: '${attr.name}' with value: '${value}' is not of type ${attr.type} for schema: '${schemaName}' in line ${index+2}`)
          }else{
            if(attr.type === 'bool'){
              value = !!value ? 1 : 0
            }
          }
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
    
    
    const batches = getBatchesFromArray(templates, batchSize);
    batches.forEach((templatesBatch: any[]) => {
      ux.table(templatesBatch, {
        schema: {
          get: ({ schema }) => schema,
        },
        maxSupply: {
          get: ({ maxSupply }) => maxSupply > 0 ? maxSupply : '∞',
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
    // Create Templates
    ux.action.start("Creating Templates...");
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
