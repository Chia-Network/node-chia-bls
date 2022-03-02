import SHA from 'jssha';
import { assert } from '../../internal';

export const blockSize = 32;

export function extract(salt: Uint8Array, ikm: Uint8Array): Uint8Array {
    const hash = new SHA('SHA-256', 'UINT8ARRAY', {
        hmacKey: { format: 'UINT8ARRAY', value: salt },
    });
    hash.update(ikm);
    return hash.getHash('UINT8ARRAY');
}

export function expand(
    length: number,
    prk: Uint8Array,
    info: Uint8Array
): Uint8Array {
    const blocks = Math.ceil(length / blockSize);
    let bytesWritten = 0;
    const okm: Array<number> = [];
    let temp = Uint8Array.from([]);
    for (let i = 1; i <= blocks; i++) {
        temp = extract(
            prk,
            Uint8Array.from(i === 1 ? [...info, 1] : [...temp, ...info, i])
        );
        let toWrite = length - bytesWritten;
        if (toWrite > blockSize) toWrite = blockSize;
        okm.push(...temp.slice(0, toWrite));
        bytesWritten += toWrite;
    }
    assert(bytesWritten === length);
    return Uint8Array.from(okm);
}

export function extractExpand(
    length: number,
    key: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array
): Uint8Array {
    return expand(length, extract(salt, key), info);
}
