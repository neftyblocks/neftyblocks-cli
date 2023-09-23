import { PfpAttributeMap, PfpLayerOption, PfpLayerSpec, PfpSpec } from '../types';
import { join } from 'node:path';
import sharp from 'sharp';
import crypto from 'crypto';
import { SheetContents, getSheetHeader, readExcelContents } from '../utils/excel-utils';
import { Row } from 'read-excel-file/types';

export const forceSheetName = '_force_';
export const idHeader = 'id';
export const valueHeader = 'value';
export const oddsHeader = 'odds';
export const pathHeader = 'path';
export const dependenciesHeader = 'dependencies';
export const sameIdRestrictionsHeader = 'sameIdRestrictions';
export const insertFromLayersHeader = 'insertFromLayers';
export const skipHeader = 'skip';
export const removeLayersHeader = 'removeLayers';

export async function readPfpLayerSpecs({ filePathOrSheetsId }: { filePathOrSheetsId: string }): Promise<{
  layerSpecs: PfpLayerSpec[];
  forcedPfps?: PfpAttributeMap[];
}> {
  const sheets = await readExcelContents(filePathOrSheetsId);
  const forceSheet = sheets.find((sheet) => sheet.name.toLowerCase() === forceSheetName);
  const layerSheets = sheets.filter((sheet) => sheet.name.toLowerCase() !== forceSheetName);
  const layerSpecs = layerSheets.map((sheet) =>
    getLayersSpecs({
      sheet,
    }),
  );

  const forcedPfps = forceSheet ? getForcePfps({ sheet: forceSheet, layerSpecs }) : [];

  return {
    layerSpecs,
    forcedPfps,
  };
}

export function getLayersSpecs({ sheet }: { sheet: SheetContents }): PfpLayerSpec {
  const rows = sheet.rows;
  if (rows.length < 2) {
    throw new Error(`No entries in the ${sheet.name} sheet`);
  }

  const { headersMap, validateHeaders } = getSheetHeader(rows);
  const validationError = validateHeaders([valueHeader, oddsHeader, idHeader]);

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const contentRows = rows.slice(1);
  const optionsMap: Record<string, PfpLayerOption> = {};

  contentRows.forEach((row: Row) => {
    const {
      id,
      value,
      odds,
      skipLayers,
      insertFromLayer,
      imagePath,
      dependencies,
      sameIdRestrictions,
      layersToRemove,
    } = readContentRows({ row, headersMap });

    const option = optionsMap[id];
    if (!option) {
      optionsMap[id] = {
        id,
        value,
        odds,
        imagePaths: [],
        skipLayers,
        insertFromLayer,
        layersToRemove,
      };
    }

    if (imagePath) {
      optionsMap[id].odds += odds;
      optionsMap[id]?.imagePaths.push({
        value: imagePath,
        dependencies,
        sameIdRestrictions,
      });
    }
  });

  return {
    name: sheet.name,
    options: Object.values(optionsMap),
  };
}

function getForcePfps({ sheet, layerSpecs }: { sheet: SheetContents; layerSpecs: PfpLayerSpec[] }): PfpAttributeMap[] {
  const rows = sheet.rows;
  if (rows.length < 1) {
    throw new Error(`No entries in the ${sheet.name} sheet`);
  }

  const { headersMap, validateHeaders } = getSheetHeader(rows);
  const layerNames = layerSpecs.map((layerSpec) => layerSpec.name);
  const validationError = validateHeaders(layerNames);

  if (validationError) {
    throw new Error(`Error in sheet ${sheet.name}: ${validationError}`);
  }

  const contentRows = rows.slice(1);
  const forcePfps: PfpAttributeMap[] = [];

  contentRows.forEach((row: Row) => {
    const forcePfp: PfpAttributeMap = {};
    layerNames.forEach((layerName) => {
      const layerValue = row[headersMap[layerName]]?.toString()?.trim();
      if (layerValue) {
        forcePfp[layerName] = layerValue;
      }
    });
    if (Object.keys(forcePfp).length > 0) {
      forcePfps.push(forcePfp);
    }
  });

  return forcePfps;
}

function readContentRows({ row, headersMap }: { row: Row; headersMap: Record<string, number> }): {
  id: string;
  value: string;
  odds: number;
  imagePath?: string;
  skipLayers: {
    [key: string]: {
      values: string[];
      skipNone: boolean;
    };
  };
  insertFromLayer: {
    [key: string]: string;
  };
  dependencies: {
    [key: string]: string;
  };
  sameIdRestrictions: {
    [key: string]: string;
  };
  layersToRemove: string[];
} {
  const id = row[headersMap[idHeader]].toString();
  const value = row[headersMap[valueHeader]].toString();
  const odds = row[headersMap[oddsHeader]] as number;
  const pathString = (row[headersMap[pathHeader]] || '') as string;
  const imagePath = pathString ? pathString : undefined;
  const skipString = (row[headersMap[skipHeader]] || '') as string;
  const removeLayersString = (row[headersMap[removeLayersHeader]] || '') as string;
  const dependenciesString = (row[headersMap[dependenciesHeader]] || '') as string;
  const insertFromLayersString = (row[headersMap[insertFromLayersHeader]] || '') as string;
  const sameIdRestrictionString = (row[headersMap[sameIdRestrictionsHeader]] || '') as string;

  // Get layers to remove
  const layersToRemove = removeLayersString
    .split(',')
    .map((optionId) => optionId.trim())
    .filter((optionId) => optionId.length > 0);

  // Get skipped options
  const skipLayers: {
    [key: string]: {
      values: string[];
      skipNone: boolean;
    };
  } = {};
  const skipOptions = skipString
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
  skipOptions.forEach((option) => {
    const [layerName, optionsString] = option.split(':').map((value) => value.trim());
    const optionIds = (optionsString || '')
      .split(',')
      .map((optionId) => optionId.trim())
      .filter((optionId) => optionId.length > 0);
    if (!skipLayers[layerName]) {
      skipLayers[layerName] = {
        values: [],
        skipNone: false,
      };
    }
    if (optionIds.length > 0) {
      const skipNone = optionIds.find((optionId) => isNoneOption(optionId));
      if (skipNone) {
        skipLayers[layerName].skipNone = true;
      }
      skipLayers[layerName].values.push(...optionIds);
    }
  });

  // Get dependencies
  const dependencies = dependenciesString
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0)
    .reduce((acc: { [key: string]: string }, option: string) => {
      const [layerName, dependencyValue] = option.split(':').map((value) => value.trim());
      if (dependencyValue) {
        acc[layerName] = dependencyValue;
      }
      return acc;
    }, {});

  // Same id restrictions
  const sameIdRestrictions = sameIdRestrictionString
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0)
    .reduce((acc: { [key: string]: string }, option: string) => {
      const [restrictionName, restrictionValue] = option.split(':').map((value) => value.trim());
      if (restrictionValue) {
        acc[restrictionName] = restrictionValue;
      }
      return acc;
    }, {});

  // Layers to insert
  const insertFromLayer = insertFromLayersString
    .split('\n')
    .map((option) => option.trim())
    .filter((option) => option.length > 0)
    .reduce((acc: { [key: string]: string }, option: string) => {
      const [layerName, optionId] = option.split(':').map((value) => value.trim());
      if (optionId) {
        acc[layerName] = optionId;
      } else {
        throw new Error(`Invalid insertFromLayers value ${layerName}:${option}`);
      }
      return acc;
    }, {});

  return {
    id,
    value,
    odds,
    imagePath,
    skipLayers,
    insertFromLayer,
    dependencies,
    sameIdRestrictions,
    layersToRemove,
  };
}

export function generatePfps({
  quantity,
  layerSpecs,
  forcedPfps,
}: {
  quantity: number;
  layerSpecs: PfpLayerSpec[];
  forcedPfps?: PfpAttributeMap[];
}): PfpSpec[] {
  const pfps: PfpSpec[] = [];
  const usedDnas: string[] = [];

  // Add forced pfps first
  if (forcedPfps) {
    forcedPfps.forEach((forcedPfp) => {
      const pfp = generatePfp({ layerSpecs, fromAttributes: forcedPfp });
      if (pfp && !usedDnas.includes(pfp.dna)) {
        pfps.push(pfp);
        usedDnas.push(pfp.dna);
      }
    });
  }

  while (pfps.length < quantity) {
    const pfp = generatePfp({ layerSpecs });
    if (pfp && !usedDnas.includes(pfp.dna)) {
      pfps.push(pfp);
      usedDnas.push(pfp.dna);
    }
  }

  return pfps;
}

export function generatePfp({
  layerSpecs,
  fromAttributes,
}: {
  layerSpecs: PfpLayerSpec[];
  fromAttributes?: PfpAttributeMap;
}): PfpSpec | null {
  const attributes: PfpAttributeMap = {};
  const attributesById: PfpAttributeMap = {};
  const restrictions: Record<
    string,
    {
      values: string[];
      skipNone: boolean;
    }
  > = {};
  const layerImages: Record<string, string[]> = {};

  for (let i = 0; i < layerSpecs.length; i++) {
    const layerSpec = layerSpecs[i];
    const sortedOptions = getAvailableOptions({
      layerSpec,
      restrictions,
      attributesById,
    });

    let option: PfpLayerOption | undefined;
    if (fromAttributes) {
      option = sortedOptions.find((option) => option.id === fromAttributes[layerSpec.name]);
    } else {
      const totalOdds = sortedOptions.reduce((acc, option) => acc + option.odds, 0);
      let random = Math.floor(Math.random() * totalOdds);
      option = sortedOptions.find((option) => {
        if (random < option.odds) {
          return true;
        }
        random -= option.odds;
        return false;
      });
    }

    if (!option) {
      // If no option is found the pfp is invalid
      if (fromAttributes) {
        throw new Error(
          `Invalid pfp, no option found for ${fromAttributes[layerSpec.name]} in layer ${layerSpec.name}`,
        );
      }
      return null;
    }

    // Add to restrictions if incompatible options are found
    if (option.skipLayers) {
      Object.keys(option.skipLayers).forEach((layerName) => {
        const incompatibleOptions = option!.skipLayers![layerName] || {
          values: [],
          skipNone: false,
        };
        if (!restrictions[layerName]) {
          restrictions[layerName] = {
            values: [...incompatibleOptions.values],
            skipNone: incompatibleOptions.skipNone,
          };
        }

        if (incompatibleOptions.skipNone) {
          restrictions[layerName].skipNone = true;
        }

        if (incompatibleOptions.values.length === 0) {
          restrictions[layerName].values = [];
        } else if (restrictions[layerName].values.length > 0) {
          restrictions[layerName].values.push(...incompatibleOptions.values);
          restrictions[layerName].values = [...new Set(restrictions[layerName].values)];
        }
      });
    }

    // If there are multiple image paths, the pfp is invalid
    if (option.imagePaths.length > 1) {
      throw new Error(`Invalid pfp, multiple image paths found for ${option.id} in layer ${layerSpec.name}`);
    }

    // Add image path (if present) to layer
    const imagePath = option.imagePaths[0]?.value;
    if (imagePath) {
      layerImages[layerSpec.name] = [imagePath];
    } else {
      layerImages[layerSpec.name] = [];
    }

    // If there is an insertFromLayer option, we need to insert the image path at the layer index
    if (option.insertFromLayer) {
      Object.keys(option.insertFromLayer).forEach((layerName) => {
        const optionId = option!.insertFromLayer![layerName];
        const optionToInclude = layerSpecs
          .find((layerSpec) => layerSpec.name === layerName)
          ?.options.find((option) => option.id === optionId);
        if (optionToInclude) {
          // Insert the image path at the layer index without replacing the existing one
          const randomIndex = Math.floor(Math.random() * optionToInclude.imagePaths.length);
          const imagePath = optionToInclude.imagePaths[randomIndex]?.value;
          if (imagePath) {
            layerImages[layerName].splice(0, 0, imagePath);
          }
        }
      });
    }

    // Remove layers if needed
    if (option.layersToRemove) {
      option.layersToRemove.forEach((layerName) => {
        layerImages[layerName] = [];
        attributes[layerName] = formatOptionValue('');
        attributesById[layerName] = '';
      });
    }

    attributes[layerSpec.name] = formatOptionValue(option.value);
    attributesById[layerSpec.name] = option.id;
  }

  const dnaComponents = layerSpecs.map((layerSpec) => `${layerSpec.name}:${attributesById[layerSpec.name]}`).join('');
  const dna = crypto.createHash('sha256').update(dnaComponents).digest('hex');
  return {
    imageLayers: layerSpecs.flatMap((layerSpec) => layerImages[layerSpec.name]),
    dna,
    attributes: layerSpecs
      .map((layerSpec) => ({
        name: layerSpec.name,
        value: attributes[layerSpec.name],
        id: attributesById[layerSpec.name],
      }))
      .filter((attribute) => attribute.value),
  };
}

export function getAvailableOptions({
  layerSpec,
  restrictions,
  attributesById,
}: {
  layerSpec: PfpLayerSpec;
  restrictions: Record<
    string,
    {
      values: string[];
      skipNone: boolean;
    }
  >;
  attributesById: PfpAttributeMap;
}): PfpLayerOption[] {
  const sortedOptions = layerSpec.options
    .map((option) => {
      // Filter out options that are restricted
      const layerRestrictions = restrictions[layerSpec.name];
      if (layerRestrictions) {
        const restrictictedOptionIds = layerRestrictions.values;
        if (restrictictedOptionIds.length === 0) {
          // Edge case for none option so that it can be used as a valid option
          if (!layerRestrictions.skipNone) {
            if (isNoneOption(option.id)) {
              return {
                ...option,
                imagePaths: [],
              };
            }
          }

          return null;
        }

        if (restrictictedOptionIds.includes(option.id)) {
          return null;
        }
      }

      if (option.imagePaths.length === 0) {
        return {
          ...option,
          imagePaths: [],
        };
      }

      // Filter out options that don't match dependencies or same id restrictions
      const matchingImagePaths = option.imagePaths.filter((imagePath) => {
        const matchesDependencies = Object.keys(imagePath.dependencies || {}).every((dependency) => {
          return attributesById[dependency] === imagePath.dependencies?.[dependency];
        });

        const matchesSameIdRestrictions = Object.keys(imagePath.sameIdRestrictions || {}).every((restriction) => {
          return attributesById[restriction] !== imagePath.sameIdRestrictions?.[restriction];
        });

        return matchesDependencies && matchesSameIdRestrictions;
      });

      if (matchingImagePaths.length === 0) {
        return null;
      }

      return {
        ...option,
        imagePaths: matchingImagePaths,
      };
    })
    .filter((option) => !!option)
    .sort((a, b) => a!.odds - b!.odds) as PfpLayerOption[];

  return sortedOptions;
}

export async function generateImage({
  pfp,
  outputFolder,
  rootDir,
  resizeWidth,
}: {
  pfp: PfpSpec;
  rootDir: string;
  outputFolder: string;
  resizeWidth?: number;
}): Promise<void> {
  const compositeOptions = pfp.imageLayers.map((layer) => ({
    input: join(rootDir, layer),
  }));

  const outputPath = join(outputFolder, `${pfp.dna}.png`);

  const composition = await sharp(compositeOptions[0].input)
    .composite(compositeOptions.slice(1))
    .removeAlpha()
    .png()
    .toBuffer();

  if (resizeWidth) {
    sharp(composition).resize(resizeWidth).toFile(outputPath);
  } else {
    sharp(composition).toFile(outputPath);
  }
}

function isNoneOption(value: string): boolean {
  const lowerCaseValue = value.toLowerCase();
  return lowerCaseValue === 'none' || lowerCaseValue === '' || lowerCaseValue === '-1';
}

function formatOptionValue(value: string): string {
  if (isNoneOption(value)) {
    return 'None';
  }
  return value.trim();
}
