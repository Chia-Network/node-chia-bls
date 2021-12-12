import { createHash } from 'crypto';
import { HashInfo } from '../internal.js';

export const sha256: HashInfo = {
    byteSize: 32,
    blockSize: 64,
    convert: (buffer) => createHash('sha256').update(buffer).digest(),
};

export const sha512: HashInfo = {
    byteSize: 64,
    blockSize: 128,
    convert: (buffer) => createHash('sha512').update(buffer).digest(),
};
