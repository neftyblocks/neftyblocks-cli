import { Args } from '@oclif/core';
import { BaseCommand } from '../../base/BaseCommand.js';
import { confirmPrompt, makeSpinner } from '../../utils/tty-utils.js';
import {
  readUpgradesExcel,
  readSpecsExcel,
  readIngredientsExcel,
  createUpgrade,
  readExcelTemplate,
  addUpgradeFee,
} from '../../services/upgrade-service.js';
import { IngredientConf, Upgrade } from '../../types/upgrades.js';
import { AssetSchema } from '../../types/schemas.js';
import { getCollectionSchemas } from '../../services/schema-service.js';

export default class CreateUpgradesCommand extends BaseCommand {
  static examples = [
    {
      command: '<%= config.bin %> <%= command.id %> upgrade-specs.xlsx upgrades',
      description: 'Creates all the upgrades defined in the upgrade-specs.xlsx file.',
    },
  ];
  static description = 'Creates defined upgrades.';

  static args = {
    input: Args.string({
      description: 'Location or google sheets id of the excel file with the upgrades definitions.',
      required: true,
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(CreateUpgradesCommand);
    const config = await this.getCliConfig();

    const spinner = makeSpinner();
    spinner.start('Reading file for Upgrades...');
    //READ xls file

    const { rows } = await readExcelTemplate({
      filePath: args.input,
    });
    spinner.succeed();

    spinner.start('Reading Upgrades...');
    const { upgrades } = await readUpgradesExcel({
      rows: rows,
      acc: config.session.actor.toString(),
    });

    spinner.succeed();

    const schemas = new Map();
    if (upgrades.length > 0) {
      for (const it of upgrades) {
        if (!schemas.has(it.id)) {
          schemas.set(it.id, null);
          const collectionSchemas: AssetSchema[] = await getCollectionSchemas(it.data.collection_name, config);
          schemas.set(it.id, collectionSchemas);
        }
      }
    }

    spinner.start('Checking Upgrades Rules and Results...');
    //READ xls file
    const { specs } = await readSpecsExcel({
      rows: rows,
      config,
      schemas,
    });
    spinner.succeed();

    // Tinkering and getting requirements and results per upgrade id
    spinner.start('Handling Mutations');
    //Sort by order
    specs.sort((a, b) => a.order - b.order);
    const mergedUpgrades = Object.values(
      specs.reduce(
        (acc, item) => {
          if (!acc[item.id]) {
            acc[item.id] = { ...item, upgrade_requirements: [], upgrade_results: [] };
          }
          acc[item.id].upgrade_requirements.push(...item.upgrade_requirements);
          acc[item.id].upgrade_results.push(...item.upgrade_results);
          return acc;
        },
        {} as Record<number, (typeof specs)[0]>,
      ),
    );

    upgrades.forEach((upgrade: Upgrade) => {
      const upgradeSpecs = mergedUpgrades.find((spec) => spec.id == upgrade.id);
      if (upgradeSpecs) {
        const upgrade_specs = [
          {
            schema_name: upgradeSpecs.schema,
            display_data: '{}',
            upgrade_requirements: upgradeSpecs.upgrade_requirements,
            upgrade_results: upgradeSpecs.upgrade_results,
          },
        ];
        upgrade.data.upgrade_specs = upgrade_specs;
      }
    });
    spinner.succeed();

    spinner.start('Checking Ingredients for Upgrades ...');
    const { ingredients } = await readIngredientsExcel({
      rows: rows,
      schemas: schemas,
    });
    //Fill upgrade with its ingredients
    ingredients.forEach((ingredient: IngredientConf) => {
      const upgrade = upgrades.find((upgrade) => upgrade.id === ingredient.id);
      upgrade?.data.ingredients.push(ingredient.ingredient);
    });
    //validate at least 1 ingredient on each upgrade
    let missingIngredient = false;
    upgrades.forEach((upgrade: Upgrade) => {
      if (upgrade.data.ingredients.length == 0) {
        spinner.fail(`Upgrade with Id: ${upgrade.id} needs at least one ingredient`);
        missingIngredient = true;
        return;
      }
      addUpgradeFee(upgrade);
    });
    //stop process
    if (missingIngredient) {
      return;
    }
    spinner.succeed();

    const proceed = await confirmPrompt(`About to create ${upgrades.length} Upgrades. Continue?`);
    if (!proceed) return;

    spinner.start('Creating Upgrades ...');

    const result = await createUpgrade(upgrades, config);
    const txId = result.resolved?.transaction.id.toString() ?? '';
    console.log(Buffer.from(txId).toString('hex'));

    spinner.succeed();
  }
}
