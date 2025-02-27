import { SheetContents, getSheetHeader, readExcelContents } from '../utils/excel-utils.js';
import { Row } from 'read-excel-file';
import { Upgrade, DisplayData, Ingredient, IngredientConf, UpgradeSpec, Attribute } from '../types/upgrades.js';
import { CliConfig } from '../types/cli-config.js';
import { getTemplatesFromSchema } from './template-service.js';
import { AssetSchema } from '../types/schemas.js';
import { SchemaObject } from 'atomicassets/build/Schema/index.js';
import { ITemplate } from 'atomicassets/build/API/Explorer/Objects.js';
import { getUpgradeType, transformToUpgradeType, transformValueToType } from '../utils/attributes-utils.js';
import { transact } from './antelope-service.js';
import { AnyAction } from '@wharfkit/session';

// Config Tab
export const idHeader = 'id';
export const schemaHeader = 'schema';
export const templateHeader = 'template';
export const nameHeader = 'name';
export const imageHeader = 'image';
export const videoHeader = 'video';
export const categoryHeader = 'category';
export const descriptionHeader = 'description';
export const maxUsesHeader = 'max_uses';
export const startDateHeader = 'start_date';
export const endDateHeader = 'end_date';
export const whitelistHeader = 'whitelist';
export const hiddenHeader = 'hidden';
export const revealVideoHeader = 'reveal_video';
export const backgroundColorHeader = 'background_color';

//Upgrade Tab
export const configIdHeader = 'config_id';
export const attributeHeader = 'attribute';
export const matchTemplatesHeader = 'match_templates';
export const matchAttributeHeader = 'match_attribute';
export const matchAttributeValuesHeader = 'match_attribute_values';
export const attributeToMutateHeader = 'attribute_to_mutate';
export const effectHeader = 'effect';
export const valueHeader = 'value';

//Ingredients Tab
export const typeHeader = 'type';
export const displayDataHeader = 'display_data';
export const collectionHeader = 'collection';
export const schemaAttributesHeader = 'schema_attributes';
export const allowedValuesAttributesHeader = 'allowed_values_for_attribute';
export const schemaAttributesWithAllowedValuesHeader = 'schema_attributes_with_allowed_values';
export const balanceAttributeHeader = 'balance_attribute';
export const balanceAttributCosteHeader = 'balance_cost';
export const tokenHeader = 'token';
export const tokenPrecisionHeader = 'token_precision';
export const tokenContractHeader = 'token_contract';
export const amountHeader = 'amount';
export const receipientHeader = 'recipient';

//Xls sheet names
export const configSheetName = 'config';
export const upgradeSpecSheetName = 'upgrade';
export const ingredientsSheetName = 'ingredients';

export const ingredientType = {
  attribute: 'ATTRIBUTE_INGREDIENT',
  typedAttribute: 'TYPED_ATTRIBUTE_INGREDIENT', //To be supported
  template: 'TEMPLATE_INGREDIENT',
  balance: 'BALANCE_INGREDIENT',
  schema: 'SCHEMA_INGREDIENT',
  collection: 'COLLECTION_INGREDIENT',
  token: 'FT_INGREDIENT',
};

export const upgradeRequirementType = {
  templateRequirement: 'TEMPLATE_REQUIREMENT',
  templatesRequirement: 'TEMPLATES_REQUIREMENT',
  typedAttributeRequirement: 'TYPED_ATTRIBUTE_REQUIREMENT',
};

export const upgradeResultOperationType = {
  set: 0,
  add: 1,
};

export const upgradeTypesAllowed = {
  [upgradeResultOperationType.set]: ['string', 'image', 'ipfs', 'uint8', 'int64', 'uint64', 'double', 'bool'],
  [upgradeResultOperationType.add]: ['uint8', 'int64', 'uint64', 'double', 'string'],
};

export async function readExcelTemplate({ filePath }: { filePath: string }): Promise<{
  rows: SheetContents[];
}> {
  // Read XLS file
  try {
    const rows = await readExcelContents(filePath);
    return { rows };
  } catch (error: any) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

export async function readUpgradesExcel({ rows, acc }: { rows: SheetContents[]; acc: string }): Promise<{
  upgrades: Upgrade[];
}> {
  // Read XLS file
  try {
    const configSheet = rows.find((sheet) => sheet.name.toLowerCase() === configSheetName);
    if (!configSheet) {
      throw new Error(`required sheet does not exists`);
    }
    const upgrades: Upgrade[] = await getUpgrades({ sheet: configSheet, acc: acc });
    return {
      upgrades,
    };
  } catch (error: any) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

export async function readSpecsExcel({
  rows,
  config,
  schemas,
}: {
  rows: SheetContents[];
  config: CliConfig;
  schemas: Map<number, AssetSchema[]>;
}): Promise<{
  specs: UpgradeSpec[];
}> {
  try {
    const upgradeSpecSheet = rows.find((sheet) => sheet.name.toLowerCase() === upgradeSpecSheetName);
    if (!upgradeSpecSheet) {
      throw new Error(`required sheet does not exists`);
    }
    const specs: UpgradeSpec[] = await getUpgradeSpecs({ sheet: upgradeSpecSheet, config: config, schemas: schemas });
    return {
      specs,
    };
  } catch (error: any) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

export async function readIngredientsExcel({
  rows,
  schemas,
}: {
  rows: SheetContents[];
  schemas: Map<number, AssetSchema[]>;
}): Promise<{
  ingredients: IngredientConf[];
}> {
  try {
    const ingredientsSheet = rows.find((sheet) => sheet.name.toLowerCase() === ingredientsSheetName);
    if (!ingredientsSheet) {
      throw new Error(`required sheet does not exists`);
    }
    const ingredients: IngredientConf[] = await getIngredients({ sheet: ingredientsSheet, schemas: schemas });
    return { ingredients };
  } catch (error: any) {
    throw new Error(`Error reading file: ${error.message}`);
  }
}

//Reads the first xls sheet and returns an Upgrade[]
async function getUpgrades({ sheet, acc }: { sheet: SheetContents; acc: string }): Promise<Upgrade[]> {
  if (sheet === undefined) {
    throw new Error(`required sheet does not exists`);
  }
  const rows = sheet.rows;
  if (rows.length < 2) {
    throw new Error(`No entries in the ${sheet.name} sheet`);
  }

  const { headersMap, validateHeaders } = getSheetHeader(rows);
  const validationError = validateHeaders([
    idHeader,
    schemaHeader,
    templateHeader,
    nameHeader,
    imageHeader,
    videoHeader,
    categoryHeader,
    descriptionHeader,
    maxUsesHeader,
    startDateHeader,
    endDateHeader,
    whitelistHeader,
    hiddenHeader,
    revealVideoHeader,
    backgroundColorHeader,
  ]);

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const contentRows = rows.slice(1);
  const upgrades = contentRows.map((row: Row) => {
    return readConfigContentRows({ row, headersMap, acc });
  });
  return upgrades;
}

//Returns a base Upgrade Object
function readConfigContentRows({
  row,
  headersMap,
  acc,
}: {
  row: Row;
  headersMap: Record<string, number>;
  acc: string;
}): Upgrade {
  const id = (row[headersMap[idHeader]] || 0) as number;
  const collection = row[headersMap[collectionHeader]].toString();
  const name = (row[headersMap[nameHeader]] || '') as string;
  const image = (row[headersMap[imageHeader]] || '') as string;
  const video = (row[headersMap[videoHeader]] || '') as string;
  const category = (row[headersMap[categoryHeader]] || '') as string;
  const description = (row[headersMap[descriptionHeader]] || '') as string;
  const maxUses = (row[headersMap[maxUsesHeader]] || 0) as number;
  const startDate = (row[headersMap[startDateHeader]] || 0) as number;
  const endDate = (row[headersMap[endDateHeader]] || 0) as number;
  // const whitelist = (row[headersMap[whitelistHeader]] || '') as string;
  const hidden = (row[headersMap[hiddenHeader]] || false) as boolean;
  const revealVideo = (row[headersMap[revealVideoHeader]] || '') as string;
  const backgroundColor = (row[headersMap[backgroundColorHeader]] || '') as string;
  const displayData = getDisplayData({
    name: name,
    description: description,
    image: image,
    video: video,
    revealVideo: revealVideo,
    backgroundColor: backgroundColor,
  });
  const ingredients: Ingredient[] = [];

  return {
    id: id,
    data: {
      authorized_account: acc,
      collection_name: collection,
      ingredients: ingredients,
      upgrade_specs: [],
      start_time: startDate,
      end_time: endDate,
      max_uses: maxUses,
      display_data: JSON.stringify(displayData),
      security_id: 0, //TODO check whitelists
      is_hidden: hidden ? 1 : 0,
      category: category,
    },
  } as Upgrade;
}

//Returns Display Data Object for the Upgrade
function getDisplayData({
  name,
  description,
  image,
  video,
  revealVideo,
  backgroundColor = '#000000',
}: {
  name: string;
  description: string;
  image: string;
  video: string;
  revealVideo?: string;
  backgroundColor?: string;
}): DisplayData {
  return {
    name,
    image,
    video,
    description,
    animation: {
      result: {
        type: 'flying',
        data: {
          name_format: '%data.name%',
        },
      },
      drawing: {
        type: 'video',
        data: {
          video: revealVideo || '',
        },
        bg_color: backgroundColor,
      },
    },
  };
}

async function getUpgradeSpecs({
  sheet,
  config,
  schemas,
}: {
  sheet: SheetContents;
  config: CliConfig;
  schemas: Map<number, AssetSchema[]>;
}): Promise<UpgradeSpec[]> {
  if (sheet === undefined) {
    throw new Error(`required sheet does not exists`);
  }
  const rows = sheet.rows;
  if (rows.length < 2) {
    throw new Error(`No entries in the ${sheet.name} sheet`);
  }

  const { headersMap, validateHeaders } = getSheetHeader(rows);
  const validationError = validateHeaders([
    configIdHeader,
    schemaHeader,
    matchTemplatesHeader,
    matchAttributeHeader,
    matchAttributeValuesHeader,
    attributeToMutateHeader,
    effectHeader,
    valueHeader,
  ]);

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const upgradesSpecs: UpgradeSpec[] = [];
  const contentRows = rows.slice(1);
  for (const [index, row] of contentRows.entries()) {
    const specs = await readSpecsContentRows({ row, index, headersMap, schemas, config });
    upgradesSpecs.push(specs);
  }

  return upgradesSpecs;
}

//Returns a base Upgrade Object
async function readSpecsContentRows({
  row,
  index,
  headersMap,
  schemas,
  config,
}: {
  row: Row;
  index: number;
  headersMap: Record<string, number>;
  schemas: Map<number, AssetSchema[]>;
  config: CliConfig;
}): Promise<UpgradeSpec> {
  const id = (row[headersMap[configIdHeader]] || 0) as number;
  const schemaName = row[headersMap[schemaHeader]].toString();
  const matchTemplates = String(row[headersMap[matchTemplatesHeader]] || '') as string;
  const matchAttribute = (row[headersMap[matchAttributeHeader]] || '') as string;
  const matchAttributeValues = row[headersMap[matchAttributeValuesHeader]];
  const mutableAttributeName = (row[headersMap[attributeToMutateHeader]] || '') as string;
  const effect = (row[headersMap[effectHeader]] || 'set') as string;
  const effectValue = row[headersMap[valueHeader]];

  let validAttributeValues = '';
  if (matchAttributeValues) {
    validAttributeValues = String(matchAttributeValues);
  }

  const upgrade_requirements = [];
  const upgrade_results = [];

  //Validate ConfigId
  if (!id) {
    throw new Error(`No configId found in Upgrade Tab in row: ${index + 2}`);
  }
  if (!schemaName || schemaName.length < 1) {
    throw new Error(`No Schema found in Upgrade Tab in row: ${index + 2}`);
  }

  //Get Collection Schemas and validate that indicated schema is valid
  const upgradeSchemas = schemas.get(id);
  let templateIds: string[] = [];
  let attributesValues: string[] = [];
  const schema = upgradeSchemas?.find((schema: AssetSchema) => schema.name == schemaName);
  if (!schema) {
    throw new Error(`Schema ${schemaName} does not exists in Upgrade Tab in row: ${index + 2}`);
  }

  //### Requirements ####
  //Template Rule
  if (matchTemplates && matchTemplates.length >= 1) {
    if (matchTemplates.includes(',')) {
      templateIds = matchTemplates.split(',').map((item) => item.trim());
    } else {
      templateIds.push(matchTemplates);
    }
    //validate that specified templates actually exists
    const templates = await getTemplatesFromSchema(schema.collectionName, schema.name, config);
    const existingTemplateIds = templates.map((template: ITemplate) => template.template_id);
    templateIds.forEach((id: string) => {
      if (!existingTemplateIds.includes(id)) {
        throw new Error(
          `Template ID: ${id} does not exists in schema ${schema.name}, upgrade tab in in row ${index + 2}`,
        );
      }
    });
    const templateArray = templateIds.map((item: string) => Number(item));

    upgrade_requirements.push([
      'TEMPLATES_REQUIREMENT',
      {
        template_ids: templateArray,
      },
    ]);
  }

  //Attribute Rule
  if (matchAttribute && matchAttribute.length > 0) {
    const ruleType = 'TYPED_ATTRIBUTE_REQUIREMENT';
    //Check if Match Attribute exists in Schema
    const attribute = schema.format.find((format: SchemaObject) => format.name === matchAttribute);
    if (!attribute) {
      throw new Error(
        `**match_attribute ${matchAttribute} does not match any attribute in schema ${schema?.name}, in Upgrade Tab in row: ${index + 2}`,
      );
    }

    if (validAttributeValues && validAttributeValues.length > 0) {
      if (validAttributeValues.includes(',')) {
        attributesValues = validAttributeValues.split(',').map((item: string) => {
          let typedValue = transformValueToType(attribute.type, item.trim());
          if (!typedValue) {
            throw new Error(
              `**Value ${item.trim()} for attribute ${attribute.name} with type ${attribute.type} in schema ${schema?.name} didnt match, upgrade tab in row: ${index + 2}`,
            );
          } else {
            if (attribute.type === 'bool') {
              typedValue = typedValue ? 1 : 0;
            }
            return typedValue;
          }
        });
      } else {
        //single attribute
        let typedValue = transformValueToType(attribute.type, validAttributeValues);
        if (attribute.type === 'bool') {
          typedValue = typedValue ? 1 : 0;
        }
        attributesValues = [typedValue];
      }
    }

    upgrade_requirements.push([
      ruleType,
      {
        typed_attribute_definition: {
          attribute_name: attribute.name,
          attribute_type: attribute.type,
          comparator: 0,
          allowed_values: [getUpgradeType(attribute.type), attributesValues],
        },
      },
    ]);
  }

  //### Requirements Ends ####

  //### Mutations ###

  //Validate that attribute to mutate exists in schema
  if (mutableAttributeName) {
    const operator_value = effect == 'set' ? 0 : 1;
    const mutableAttribute = schema.format.find((format: SchemaObject) => format.name === mutableAttributeName);
    if (!mutableAttribute) {
      throw new Error(
        `attribute_to_mutate ${mutableAttributeName} does not match any attribute in schema ${schema?.name}, upgrade tab in row: ${index + 2}`,
      );
    }
    let typedValue = transformValueToType(mutableAttribute.type, effectValue);
    //Cant validate with !typedValue since there are booleans that are false
    if (typedValue == undefined) {
      throw new Error(
        `*Value ${effectValue} for attribute ${mutableAttribute.name} with type ${mutableAttribute.type} in schema ${schema?.name} didnt match, upgrade tab in row: ${index + 2}`,
      );
    }

    if (mutableAttribute.type === 'bool') {
      typedValue = typedValue ? 1 : 0;
    }

    upgrade_results.push({
      attribute_name: mutableAttribute.name,
      attribute_type: mutableAttribute.type,
      op: {
        type: operator_value,
      },
      value: ['IMMEDIATE_VALUE', [transformToUpgradeType(mutableAttribute.type), typedValue]],
    });
  }

  return {
    id: id,
    schema: schema.name,
    order: index + 2,
    upgrade_requirements: upgrade_requirements,
    upgrade_results: upgrade_results,
  } as UpgradeSpec;
}

//Returns Ingredients
function readIngredientsContentRows({
  row,
  headersMap,
  schemas,
  index,
}: {
  row: Row;
  headersMap: Record<string, number>;
  schemas: Map<number, AssetSchema[]>;
  index: number;
}): IngredientConf {
  const configId = (row[headersMap[configIdHeader]] || 0) as number;
  const type = (row[headersMap[typeHeader]] || '') as string;
  const displayData = (row[headersMap[displayDataHeader]] || '') as string;
  const collection = (row[headersMap[collectionHeader]] || '') as string;
  const schemaName = (row[headersMap[schemaHeader]] || '') as string;
  const template = (row[headersMap[templateHeader]] || '') as string;
  const schemaAllowedValues: string = (row[headersMap[schemaAttributesWithAllowedValuesHeader]] || '') as string;
  const balanceAttributes = (row[headersMap[balanceAttributeHeader]] || '') as string;
  const balanceAttributeCost = (row[headersMap[balanceAttributCosteHeader]] || 0) as number;
  const token = (row[headersMap[tokenHeader]] || '') as string;
  const tokenPrecision = (row[headersMap[tokenPrecisionHeader]] || 8) as number;
  // const tokenContract = (row[headersMap[tokenContractHeader]] || '') as string;
  const amount = (row[headersMap[amountHeader]] || 0) as number;
  const effect = (row[headersMap[effectHeader]] || '') as string;
  const recipient = (row[headersMap[receipientHeader]] || '') as string;

  const attributes = (row[headersMap[schemaAttributesHeader]] || '') as string;
  const allowedValues: string = (row[headersMap[allowedValuesAttributesHeader]] || '') as string;

  let effectType = [];
  if (effect === 'burn') {
    effectType = ['TYPED_EFFECT', { type: 0 }];
  } else {
    effectType = ['TRANSFER_EFFECT', { to: recipient }];
  }

  if (type === 'token') {
    const fixedAmount = amount.toFixed(tokenPrecision);
    const quantity = `${fixedAmount} ${token}`;
    return {
      id: configId,
      ingredient: [
        ingredientType.token,
        {
          quantity: quantity,
          effect: ['TRANSFER_EFFECT', { to: recipient }],
          display_data: JSON.stringify({
            description: displayData,
          }),
        },
      ] as Ingredient,
    };
  }

  //Token does not need schema so validation is done after checking Token
  //Validate ConfigId
  if (!configId) {
    throw new Error(`No configId found in Upgrade Tab in row: ${index + 2}`);
  }
  if (!schemaName || schemaName.length < 1) {
    throw new Error(`No Schema found in Upgrade Tab in row: ${index + 2}`);
  }
  const upgradeSchemas = schemas.get(configId);
  const schema = upgradeSchemas?.find((schema: AssetSchema) => schema.name == schemaName);
  if (!schema) {
    throw new Error(`Schema ${schemaName} does not exists in Upgrade Tab in row: ${index + 2}`);
  }

  if (type === 'template') {
    return {
      id: configId,
      ingredient: [
        ingredientType.template,
        {
          collection_name: collection,
          template_id: template,
          amount: amount,
          effect: effectType,
        },
      ] as Ingredient,
    };
  }
  if (type === 'attribute') {
    const allowedAttributes: Attribute[] = [];
    try {
      type DataObject = Record<string, string[]>;
      const jsonObject = JSON.parse(String(schemaAllowedValues)) as DataObject;
      Object.entries(jsonObject).forEach(([key, values]) => {
        const attribute = schema.format.find((format: SchemaObject) => format.name === key);
        if (!attribute) {
          throw new Error(
            `**match_attribute ${key} does not match any attribute in schema ${schema?.name}, in Upgrade Tab in row: ${index + 2}`,
          );
        }
        if (attribute?.type == 'string' && Array.isArray(values)) {
          allowedAttributes.push({
            attribute_name: key,
            allowed_values: values,
          });
        } else {
          console.log(
            `schema attribute ${attribute.name} is not of type strig, ignoring... in Upgrade Tab in row: ${index + 2}`,
          );
        }
      });
    } catch (error: any) {
      console.error('Invalid JSON:', error.message);
      throw new Error(`schema_attributes_with_allowed_values is not a valid JSON, in Upgrade Tab in row: ${index + 2}`);
    }

    return {
      id: configId,
      ingredient: [
        ingredientType.attribute,
        {
          collection_name: collection,
          schema_name: schema.name,
          attributes: allowedAttributes,
          display_data: JSON.stringify({
            description: displayData,
          }),
          amount: amount,
          effect: effectType,
        },
      ] as Ingredient,
    };
  }

  if (type === 'typedattribute') {
    const allowedValuesArray = allowedValues
      ? String(allowedValues)
          .split(',')
          .map((item) => item.trim())
      : [];
    const attribute = schema.format.find((format: SchemaObject) => format.name === attributes);
    if (!attribute) {
      throw new Error(
        `**match_attribute ${attributes} does not match any attribute in schema ${schema?.name}, in Upgrade Tab in row: ${index + 2}`,
      );
    }
    return {
      id: configId,
      ingredient: [
        ingredientType.typedAttribute,
        {
          collection_name: collection,
          schema_name: schema.name,
          attributes: [
            {
              attribute_name: attribute.name,
              attribute_type: attribute.type,
              comparator: 0,
              allowed_values: [getUpgradeType(attribute.type), allowedValuesArray],
            },
          ],
          display_data: JSON.stringify({
            description: displayData,
          }),
          amount: amount,
          effect: effectType,
        },
      ] as Ingredient,
    };
  }

  if (type === 'schema') {
    return {
      id: configId,
      ingredient: [
        ingredientType.schema,
        {
          collection_name: collection,
          schema_name: schema.name,
          display_data: JSON.stringify({
            description: displayData,
          }),
          amount: amount,
          effect: effectType,
        },
      ] as Ingredient,
    };
  }
  if (type === 'collection') {
    return {
      id: configId,
      ingredient: [
        ingredientType.collection,
        {
          collection_name: collection,
          amount: amount,
          effect: effectType,
        },
      ] as Ingredient,
    };
  }
  if (type === 'balance') {
    return {
      id: configId,
      ingredient: [
        ingredientType.balance,
        {
          schema_name: schema.name,
          collection_name: collection,
          template_id: template,
          attribute_name: balanceAttributes,
          cost: balanceAttributeCost,
          display_data: JSON.stringify({
            description: displayData,
          }),
        },
      ] as Ingredient,
    };
  }

  throw new Error('Invalid ingredient type');
}

async function getIngredients({
  sheet,
  schemas,
}: {
  sheet: SheetContents;
  schemas: Map<number, AssetSchema[]>;
}): Promise<IngredientConf[]> {
  if (sheet === undefined) {
    throw new Error(`required sheet does not exists`);
  }
  const rows = sheet.rows;
  if (rows.length < 2) {
    throw new Error(`No entries in the ${sheet.name} sheet`);
  }

  const { headersMap, validateHeaders } = getSheetHeader(rows);
  const validationError = validateHeaders([
    typeHeader,
    displayDataHeader,
    collectionHeader,
    schemaAttributesWithAllowedValuesHeader,
    balanceAttributeHeader,
    balanceAttributCosteHeader,
    tokenHeader,
    tokenPrecisionHeader,
    tokenContractHeader,
    amountHeader,
    effectHeader,
    receipientHeader,
  ]);

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const contentRows = rows.slice(1);
  const ingredients: IngredientConf[] = contentRows.map((row: Row, index: number) => {
    return readIngredientsContentRows({ row, headersMap, schemas, index });
  });

  return ingredients;
}

export function addUpgradeFee(upgrade: Upgrade): Upgrade {
  const fee = [
    ingredientType.token,
    {
      quantity: '0.01000000 WAX',
      effect: ['TRANSFER_EFFECT', { to: 'fees.nefty' }],
    },
  ] as Ingredient;

  upgrade.data.ingredients.push(fee);

  return upgrade;
}

export async function createUpgrade(upgrades: Upgrade[], config: CliConfig) {
  const session = config.session;
  if (!session) {
    throw Error('Invalid session');
  }
  try {
    const session = config.session;
    const authorization = [
      {
        actor: session.actor,
        permission: session.permission,
      },
    ];
    const actions: AnyAction[] = upgrades.map((upgrade: Upgrade) => {
      return {
        account: 'up.nefty',
        name: 'createupgrde',
        authorization,
        data: upgrade.data,
      };
    });
    return await transact(actions, config);
  } catch (error) {
    throw Error('Invalid input');
  }
}
