/// <reference types="node" />
import { randomBytes } from 'node:crypto';

export const getRandomBytes = (count: number): Uint8Array => new Uint8Array(randomBytes(count));
