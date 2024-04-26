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

export interface JsonPfpData {
  attributes: JsonPfpAttribute[];
  blockRules: JsonPfpBlockRules[];
}

export interface JsonPfpAttribute {
  attribute_name: string;
  possible_values: JsonPfpPossibleValue[];
}

export interface JsonPfpPossibleValue {
  value: string;
  chance: number;
  guaranteed: boolean;
  layers: JsonPfpPossibleValueLayer[];
}

export interface JsonPfpPossibleValueLayer {
  ipfs: string;
  layer: number;
  width: number;
  height: number;
}

export interface JsonPfpBlockRules {
  base_attribute: JsonPfpBlockRuleAttr;
  attribute_blacklist: JsonPfpBlockRuleAttr[];
}

export interface JsonPfpBlockRuleAttr {
  attribute_name: string;
  value: string;
}

export interface PfpManifest {
  collectionName: string;
  uploads: {
    [key: string]: string;
  };
  pfps: Array<Pfp>;
}

export interface Pfp {
  dna: string;
  attributes: PfpAttributeMap;
}
