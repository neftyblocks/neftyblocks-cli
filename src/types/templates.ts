export interface TemplateToCreate {
  schema: string;
  maxSupply: number;
  isBurnable: boolean;
  isTransferable: boolean;
  immutableAttributes: unknown;
}

export interface TemplateIdentifier {
  templateId: string | number;
  collectionName: string;
}
