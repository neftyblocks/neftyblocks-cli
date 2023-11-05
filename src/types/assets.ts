export interface MintData {
  authorized_minter: string;
  collection_name: string;
  schema_name: string;
  template_id: string;
  new_asset_owner: string;
  immutable_data: any[];
  mutable_data: any[];
  tokens_to_back: any[];
}

export interface AssetTransferData {
  from: string;
  to: string;
  asset_ids: string[];
  memo: string;
}
