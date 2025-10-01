#!/usr/bin/env node

import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

import {execute} from '@oclif/core'

await execute({dir: import.meta.url})
