import { Asset } from '@wharfkit/session';

export type TransferAction = {
  contract: string;
  data: {
    from: string;
    to: string;
    quantity: Asset;
    memo: string;
  };
};

export interface TokenSpec {
  contract: string;
  symbol: string;
  decimals: number;
}
