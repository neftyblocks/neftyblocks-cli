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
