import { ux, Command, Flags } from "@oclif/core";
import readXlsxFile from "read-excel-file/node";
import { TransactResult } from "eosjs/dist/eosjs-api-interfaces";
import { mintAssets } from "../antelope/asset-service";
import { Cell } from "read-excel-file/types";
import { getTemplatesMap } from "../antelope/template-service";
import { getBatchesFromArray } from "../utils/array-utils";
import { decryptConfigurationFile } from "../utils/crypto-utils";
import { fileExists } from "../utils/file-utils";

const templateField = "template";
const amountField = "amount";
const ownerField = "owner";

export default class MintAssets extends Command {
  static description = "Mint assets";

  static examples = ["<%= config.bin %> <%= command.id %> -f test.xls -s 1 -i"];

  static flags = {
    file: Flags.string({
      char: "f",
      description: "Excel file with the templates and amounts",
      required: true,
    }),
    batchSize: Flags.integer({
      char: "s",
      description: "Transactions batch size",
      required: false,
      default: 100,
    }),
    ignoreSupply: Flags.boolean({
      char: "i",
      description: "Ignore supply errors",
      default: false,
    }),
    password: Flags.string({
      char: "k",
      description: "CLI password",
      default: undefined,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MintAssets);
    const fileTemplate = flags.file;
    const batchSize = flags.batchSize;
    const ignoreSupply = flags.ignoreSupply;
    const pwd = flags.password;

    // validate CLI password
    ux.action.start("Validating...");
    const password = pwd
      ? pwd
      : await ux.prompt("Enter your CLI password", { type: "mask" });
    const config = decryptConfigurationFile(password, this.config.configDir);
    if (!config) {
      ux.action.stop();
      this.log("Invalid password, please try again...");
      this.exit();
      return;
    }
    ux.action.stop();

    ux.action.start("Getting collection schemas");
    let sheet = [];
    if (fileExists(fileTemplate)) {
      try {
        sheet = await readXlsxFile(fileTemplate);
      } catch (error) {
        this.error("Unable to read templates file");
      }
    } else {
      ux.action.stop();
      this.error("XLS file not found");
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

    if (!isHeaderPresent(templateField) || !isHeaderPresent(amountField)) {
      this.error(`Headers ${templateField}, ${amountField} must be present`);
    }

    sheet.splice(0, 1);

    const templateIndex = headersMap[templateField];
    const amountIndex = headersMap[amountField];
    const ownerIndex = headersMap[ownerField];
    const templateIds = sheet.map((row: any, index: number) => {
      const templateId = row[templateIndex];
      if (!templateId) {
        this.error(`Error in row: ${index + 2} Template is required`);
      }
      return templateId;
    });

    const templatesMap = await getTemplatesMap(templateIds, config.atomicUrl);

    const mints = [];
    for (const row of sheet) {
      const templateId = row[templateIndex].valueOf() as string;
      const template = templatesMap[templateId];
      const owner = row[ownerIndex].valueOf() as string;
      let amount = row[amountIndex].valueOf() as number;
      if (!template) {
        this.error(`Template ${templateId} doesn't exist`);
      }
      if (amount <= 0) {
        this.error("Amount must be greater than 0");
      }
      if (!owner) {
        this.error("Owner is required");
      }

      // to check if the template has enough max supply we must be mindful of the
      // fact that the same template could be in two different rows, to solve this
      // we use the template map to store how many assets of each template will
      // be minted after going thru all the rows
      if (template.currentlyMinted === undefined) {
        template.currentlyMinted = 0;
      }
      template.currentlyMinted += amount;

      if (
        parseInt(template.max_supply, 10) !== 0 &&
        template.currentlyMinted + parseInt(template.issued_supply, 10) >
          parseInt(template.max_supply, 10)
      ) {
        if (ignoreSupply) {
          const remainingSupply = template.max_supply - template.issued_supply;
          if (amount > remainingSupply && remainingSupply > 0) {
            amount = remainingSupply;
          } else {
            continue;
          }
        } else {
          this.log("Template", template);
          this.error(
            `Tempalte ${templateId} doesn't have enough max supply to mint `
          );
        }
      }

      mints.push({
        amount: amount,
        name: template.immutable_data.name,
        actionData: {
          authorized_minter: config.account,
          collection_name: template.collection.collection_name,
          schema_name: template.schema.schema_name,
          template_id: templateId,
          new_asset_owner: owner,
          immutable_data: [],
          mutable_data: [],
          tokens_to_back: [],
        },
      });
    }

    ux.action.stop();

    // Create table columns and print table
    ux.table(mints, {
      template_id: { get: (row) => row.actionData.template_id },
      name: { get: (row) => row.name },
      owner: { get: (row) => row.actionData.new_asset_owner },
      amount: { get: (row) => row.amount },
    });

    const proceed = await ux.confirm("Continue?");
    if (!proceed) return;

    // We create the mintActions array because Each *single* asset mint is an action
    // in the `mintAssets` service
    const mintActions = [];
    for (const mint of mints) {
      for (let i = 0; i < mint.amount; i++) {
        mintActions.push(mint.actionData);
      }
    }

    const actionBatches = getBatchesFromArray(mintActions, batchSize);

    let totalMintCount = 0;
    try {
      for (const mintActions of actionBatches) {
        // eslint-disable-next-line no-await-in-loop
        const result = (await mintAssets(
          mintActions,
          config
        )) as TransactResult;
        const txId = result.transaction_id;
        this.log(
          `${mintActions.length} Assets minted successfully. Transaction: ${config.explorerUrl}/transaction/${txId}`
        );
        // print how many of each template were minted
        {
          const templateAmountMap: any = {};
          for (const mintAction of mintActions) {
            if (
              templateAmountMap[mintAction.template_id.toString()] === undefined
            ) {
              templateAmountMap[mintAction.template_id.toString()] = 1;
            } else {
              templateAmountMap[mintAction.template_id.toString()] += 1;
            }
          }

          for (const templateId in templateAmountMap) {
            this.log(
              `    minted ${templateAmountMap[templateId]} of template ${templateId}`
            );
          }
        }

        totalMintCount += mintActions.length;
      }
    } catch (error) {
      this.error(
        `ERROR after minting: ${totalMintCount} successfully\n` + error
      );
    }

    this.log("Done!");
    this.exit(0);
  }
}
