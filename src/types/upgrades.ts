export interface UpgradeConfigRow {
  id: number;
  schema: string;
  template: string;
  name: string;
  image: string;
  video: string;
  category: string;
  maxUses: number;
  startDate: string;
  endDate: string;
  whitelist: string;
  hidden: boolean;
  revealVideo: string;
  backgroundColor: string;
}

export interface UpgradeSpecRow {
  configId: number;
  attribute: string;
  effect: string;
  value: string;
}

export interface IngredientRow {
  configId: number;
  type: string;
  displayData: string;
  collection: string;
  schema: string;
  tmeplate: string;
  schemaAttributes: string;
  allowedValuesForAttributes: string;
  balanceAttributes: string;
  balanceCost: string;
  token: string;
  tokenPrecision: boolean;
  tokenContract: string;
  amount: string;
  action: string;
  recipient: string;
}

export type Ingredient = [string, Record<string, any>];

export interface IngredientConf {
  id: number;
  ingredient: Ingredient;
}

export interface Upgrade {
  id: number;
  data: {
    authorized_account: string;
    collection_name: string;
    ingredients: Ingredient[];
    upgrade_specs: UpgradeSpecs[];
    start_time: number;
    end_time: number;
    max_uses: number;
    display_data: string;
    security_id: number;
    is_hidden: number;
    category: string;
  };
}

export interface AllowedValue {
  allowed_values: [string, [string]];
}

export interface Attribute {
  attribute_name: string;
  allowed_values: string[];
}

export interface UpgradeEffect {
  effect: [string, object];
}

export interface UpgradeSpec {
  id: number;
  schema: string;
  order: number;
  upgrade_requirements: [];
  upgrade_results: [];
}

export interface UpgradeSpecs {
  schema_name: string;
  display_data: string;
  upgrade_requirements: [];
  upgrade_results: [];
}

export interface DisplayData {
  name: string;
  description: string;
  image: string;
  video: string;
  animation: {
    result: {
      type: string;
      data: {
        name_format: string;
      };
    };
    drawing: {
      type: string;
      data: {
        video?: string;
      };
      bg_color: string;
    };
  };
}

export interface UpgradeToken {
  name: string;
  settlementSymbol: string;
  symbol: string;
  tokenContract: string;
}
