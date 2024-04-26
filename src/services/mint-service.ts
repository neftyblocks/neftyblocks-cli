import { ITemplate } from 'atomicassets/build/API/Explorer/Objects.js';
import { AssetSchema, CliConfig, MintRow } from '../types/index.js';
import { Row } from 'read-excel-file';
import { ux } from '@oclif/core';
import { getTemplatesMap } from './template-service.js';
import { getXlsType, isValidAttribute, transformValueToType, typeAliases } from '../utils/attributes-utils.js';
import writeXlsxFile from 'write-excel-file/node';

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

const templateField = 'template';
const amountField = 'amount';
const ownerField = 'owner';

export async function readExcelMintRows(
  rows: Row[],
  schema: AssetSchema,
  config: CliConfig,
  ignoreSupply = false,
  skip = 0,
): Promise<MintRow[]> {
  const headerRow = rows[0];
  const headersMap = Object.fromEntries(
    headerRow
      .map((name: any, index: number) => ({
        name: name.valueOf() as string,
        index,
      }))
      .map((entry: { name: string; index: number }) => [entry.name, entry.index]),
  );

  const isHeaderPresent = (text: string) => {
    return headersMap[text] >= 0;
  };

  if (!isHeaderPresent(templateField) || !isHeaderPresent(amountField)) {
    throw new Error(`Headers ${templateField}, ${amountField} must be present`);
  }

  const contentRows = rows.slice(1);
  if (skip) {
    contentRows.splice(0, skip);
  }
  const templateIndex = headersMap[templateField];
  const amountIndex = headersMap[amountField];
  const ownerIndex = headersMap[ownerField];
  const templateIds = contentRows.map((row: any, index: number) => {
    const templateId = row[templateIndex];
    if (!templateId) {
      throw new Error(`Error in row: ${index + 2} Template is required`);
    }
    return templateId;
  });

  ux.action.start('Checking Templates...');
  const templatesMap = await getTemplatesMap(templateIds, config);
  const mintedCounts: Record<string, number> = {};
  ux.action.stop();

  const mints: any[] = [];
  contentRows.forEach((row: any, index: number) => {
    const templateId = row[templateIndex] as string;
    const template = templatesMap[templateId];
    const owner = row[ownerIndex] as string;
    let amount = row[amountIndex];
    if (amount) {
      amount = row[amountIndex] as number;
    }
    if (!template && templateId !== '-1') {
      throw new Error(`Template ${templateId} doesn't exist`);
    }
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    if (!owner) {
      throw new Error('Owner is required');
    }
    const inmutableData: { [key: string]: any } = template?.immutable_data || {};
    const attributes: any[] = [];
    schema.format.forEach((attr: { name: string; type: string }) => {
      let value = row[headersMap[attr.name]];
      if (headersMap[attr.name] === undefined) {
        ux.warn(
          `The attribute: '${attr.name}' of schema: '${
            schema.name
          }' is not in any of the columns of the spreadsheet in row ${index + 2}`,
        );
      }
      if (value !== null && value !== undefined) {
        if (attr.name in inmutableData) {
          ux.warn(
            `Schema contains attribute "${
              attr.name
            }" with value: "${value}", ignoring attribute from spreadsheet in row ${index + 2}`,
          );
          return;
        }
        const type = typeAliases[attr.type] || attr.type;
        if (!isValidAttribute(attr.type, value)) {
          ux.warn(
            `The attribute: '${attr.name}' with value: '${value}' is not of type ${attr.type} for schema: '${
              schema.name
            }' in row ${index + 2}`,
          );
        } else {
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

    if (
      parseInt(template?.max_supply || '0', 10) !== 0 &&
      mintedCounts[templateId] + parseInt(template.issued_supply, 10) > parseInt(template.max_supply, 10)
    ) {
      if (ignoreSupply) {
        const remainingSupply = Number(template.max_supply) - Number(template.issued_supply);
        if (amount > remainingSupply && remainingSupply > 0) {
          amount = remainingSupply;
        } else {
          return;
        }
      } else {
        throw new Error(`Template ${templateId} doesn't have enough max supply to mint in row ${index + 2}`);
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

export async function generateMintExcelFile(
  schemas: AssetSchema[],
  templates: ITemplate[],
  output: string,
  amount: number = 1,
  owner: string = '',
): Promise<void> {
  const groupedTemplates = Object.fromEntries(
    schemas.map((schema) => [schema.name, templates.filter((template) => template.schema.schema_name === schema.name)]),
  );

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
        value: amount,
      },
      {
        type: String,
        value: owner,
      },
      ...schema.format.map((field) => ({
        type: getXlsType(field.type),
        value: transformValueToType(field.type, template.immutable_data[field.name]),
      })),
    ]);

    return [schemaHeaders, noTemplateRow, ...templateRows];
  });

  await writeXlsxFile(data, {
    sheets: schemas.map((schema) => schema.name),
    filePath: output,
  });
}

export async function generateMintExcelFileWithContent(
  schemas: AssetSchema[],
  templates: ITemplate[],
  owner: string = '',
  amount: number = 1,
  output: string,
  content: Record<string, Array<Record<string, any>>>,
): Promise<void> {
  const groupedTemplates = Object.fromEntries(
    schemas.map((schema) => [schema.name, templates.filter((template) => template.schema.schema_name === schema.name)]),
  );

  const data = schemas.map((schema) => {
    const dataHeaders = schema.format.map((field) => ({
      value: field.name,
    }));

    const schemaHeaders = [...headers, ...dataHeaders];

    const templateRows = groupedTemplates[schema.name].flatMap((template) =>
      content[template.template_id.toString()].map((record) => [
        {
          type: String,
          value: template.template_id,
        },
        {
          type: Number,
          value: amount,
        },
        {
          type: String,
          value: owner,
        },

        ...schema.format.map((field) => ({
          type: getXlsType(field.type),
          value: transformValueToType(field.type, record[field.name]),
        })),
      ]),
    );

    return [schemaHeaders, ...templateRows];
  });

  await writeXlsxFile(data, {
    sheets: schemas.map((schema) => schema.name),
    filePath: output,
  });
}
