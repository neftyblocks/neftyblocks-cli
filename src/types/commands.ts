import { MintData, AssetSchema } from '../types';

export type MintRow = {
  schema: AssetSchema;
  templateId: string;
  amount: number;
  owner: string;
  mintActionData: MintData;
};

export interface PfpLayerOption {
  id: string;
  value: string;
  odds: number;
  imagePaths: {
    value: string;
    dependencies?: {
      [key: string]: string;
    };
    sameIdRestrictions?: {
      [key: string]: string;
    };
  }[];
  skipLayers?: {
    [key: string]: {
      values: string[];
      skipNone: boolean;
    };
  };
  insertFromLayer?: {
    [key: string]: string;
  };
  layersToRemove?: string[];
}

export interface PfpLayerSpec {
  name: string;
  options: PfpLayerOption[];
}

export interface PfpAttributeMap {
  [key: string]: string;
}

export interface PfpAttribute {
  name: string;
  value: string;
  id: string;
}

export interface PfpSpec {
  imageLayers: string[];
  dna: string;
  attributes: PfpAttribute[];
}
