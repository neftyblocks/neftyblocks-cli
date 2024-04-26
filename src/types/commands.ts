import { MintData, AssetSchema } from '../types/index.js';

export type MintRow = {
  schema: AssetSchema;
  templateId: string;
  amount: number;
  owner: string;
  mintActionData: MintData;
};
