import { PrivateKey } from '@wharfkit/session';

export function validateAccountName(account: string): string | boolean {
  const regex = new RegExp('^[a-z1-5.]{0,12}$');
  const match = regex.test(account);
  const lastChar = account.at(-1);
  if (lastChar === '.' || !match) {
    return 'Can contain letters "a-z", numbers betwen "1-5" and ".". Can contain a maximum of 12 characters. Cannot end with ".".';
  }
  return true;
}

export function validatePermissionName(account: string): string | boolean {
  const regex = new RegExp('^[a-z1-5.]{0,12}$');
  const match = regex.test(account);
  if (!match) {
    return 'Can contain letters "a-z", numbers betwen "1-5" and ".". Can contain a maximum of 12 characters.';
  }
  return true;
}

export function validatePrivateKey(pkString: string): string | boolean {
  try {
    const privateKey = PrivateKey.fromString(pkString);
    return !!privateKey;
  } catch (error) {
    return 'Invalid private key';
  }
}
