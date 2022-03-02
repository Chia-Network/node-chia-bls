import SHA from 'jssha';
import { HashInfo } from '../internal';

export const sha256: HashInfo = {
    byteSize: 32,
    blockSize: 64,
    convert: (buffer) => {
        const hash = new SHA('SHA-256', 'UINT8ARRAY');
        hash.update(buffer);
        return hash.getHash('UINT8ARRAY');
    },
};

export const sha512: HashInfo = {
    byteSize: 64,
    blockSize: 128,
    convert: (buffer) => {
        const hash = new SHA('SHA-512', 'UINT8ARRAY');
        hash.update(buffer);
        return hash.getHash('UINT8ARRAY');
    },
};
