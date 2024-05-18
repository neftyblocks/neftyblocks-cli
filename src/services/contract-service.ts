import { ABI, AnyAction, Serializer, TransactResult } from '@wharfkit/session';
import { CliConfig } from '../types/cli-config.js';
import { transact } from './antelope-service.js';

const IPFS_URL = 'https://ipfs.neftyblocks.io';

export async function createAccount({
  config,
  accountName,
  bytes = 3000,
}: {
  bytes?: number;
  accountName: string;
  config: CliConfig;
}): Promise<TransactResult> {
  const actions = getCreateAccountActions({
    config,
    accountName,
    bytes,
  });
  return await transact(actions, config);
}

export async function isAccountCreated({
  config,
  accountName,
}: {
  accountName: string;
  config: CliConfig;
}): Promise<boolean> {
  try {
    const acct = await fetch(`${config.rpcUrl}/v1/chain/get_account`, {
      method: 'POST',
      body: JSON.stringify({
        account_name: accountName,
      }),
    }).then((res) => res.json());
    return acct.account_name === accountName;
  } catch (error) {
    return false;
  }
}

function getCreateAccountActions({
  config,
  accountName,
  bytes = 3000,
}: {
  bytes?: number;
  accountName: string;
  config: CliConfig;
}): AnyAction[] {
  const session = config.session;
  const authorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];
  const activeAccounts = [
    {
      permission: {
        actor: session.actor.toString(),
        permission: 'active',
      },
      weight: 1,
    },
    {
      permission: {
        actor: accountName,
        permission: 'eosio.code',
      },
      weight: 1,
    },
  ].sort((a, b) => a.permission.actor.localeCompare(b.permission.actor));
  return [
    {
      account: 'eosio',
      name: 'newaccount',
      data: {
        creator: session.actor.toString(),
        name: accountName,
        owner: {
          threshold: 1,
          keys: [],
          accounts: [
            {
              permission: {
                actor: session.actor,
                permission: 'owner',
              },
              weight: 1,
            },
          ],
          waits: [],
        },
        active: {
          threshold: 1,
          keys: [],
          accounts: activeAccounts,
          waits: [],
        },
      },
      authorization,
    },
    {
      account: 'eosio',
      name: 'buyrambytes',
      data: {
        payer: session.actor.toString(),
        receiver: accountName,
        bytes,
      },
      authorization,
    },
  ];
}

export async function deploy({
  accountName,
  abiCid,
  wasmCid,
  bytes,
  config,
}: {
  accountName: string;
  abiCid: string;
  wasmCid: string;
  bytes: number;
  config: CliConfig;
}): Promise<TransactResult> {
  const session = config.session;
  const authorization = [
    {
      actor: accountName,
      permission: 'active',
    },
  ];

  const sessionAuthorization = [
    {
      actor: session.actor,
      permission: session.permission,
    },
  ];

  const abi = await fetch(`${IPFS_URL}/ipfs/${abiCid}`)
    .then((res) => res.json())
    .then((abi) => ABI.from(abi));

  const wasmHex = await fetch(`${IPFS_URL}/ipfs/${wasmCid}`)
    .then((res) => res.arrayBuffer())
    .then((buffer) => [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, '0')).join(''));

  const encodedAbi = Serializer.encode({
    object: abi,
    type: ABI,
  });

  const deploymentActions: AnyAction[] = [
    {
      account: 'eosio',
      name: 'setcode',
      authorization,
      data: {
        account: accountName,
        code: wasmHex,
        vmtype: 0,
        vmversion: 0,
      },
    },
    {
      account: 'eosio',
      name: 'setabi',
      authorization,
      data: {
        account: accountName,
        abi: encodedAbi,
      },
    },
  ];

  const accountResources = await session.client.v1.chain.get_account(accountName);

  const neededRam = bytes - accountResources.ram_usage.toNumber();

  const actions: AnyAction[] = [
    {
      account: 'neftyblocksa',
      name: 'validate',
      authorization: sessionAuthorization,
      data: {
        nonce: 0,
      },
    },
    ...(neededRam > 0
      ? [
          {
            account: 'eosio',
            name: 'buyrambytes',
            authorization: sessionAuthorization,
            data: {
              payer: session.actor,
              receiver: accountName,
              bytes: neededRam,
            },
          },
        ]
      : []),
    ...deploymentActions,
  ];
  return await transact(actions, config);
}
