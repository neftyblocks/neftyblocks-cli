import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

export { run } from '@oclif/core';
