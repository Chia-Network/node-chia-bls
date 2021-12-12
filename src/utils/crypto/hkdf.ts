import { assert } from 'chai';
import { createHmac } from 'crypto';

export const blockSize = 32;

export function extract(salt: Buffer, ikm: Buffer): Buffer {
    return createHmac('sha256', salt).update(ikm).digest();
}

export function expand(length: number, prk: Buffer, info: Buffer): Buffer {
    const blocks = Math.ceil(length / blockSize);
    let bytesWritten = 0;
    const okm: Array<number> = [];
    let temp = Buffer.from([]);
    for (let i = 1; i <= blocks; i++) {
        const hash = createHmac('sha256', prk);
        temp = hash
            .update(Buffer.from(i === 1 ? [...info, 1] : [...temp, ...info, i]))
            .digest();
        let toWrite = length - bytesWritten;
        if (toWrite > blockSize) toWrite = blockSize;
        okm.push(...temp.slice(0, toWrite));
        bytesWritten += toWrite;
    }
    assert.equal(bytesWritten, length);
    return Buffer.from(okm);
}

export function extractExpand(
    length: number,
    key: Buffer,
    salt: Buffer,
    info: Buffer
): Buffer {
    return expand(length, extract(salt, key), info);
}
