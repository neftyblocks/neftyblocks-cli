import { SchemaObject } from 'atomicassets/build/Schema';

export interface AssetSchema {
  name: string;
  collectionName: string;
  format: SchemaObject[];
}
