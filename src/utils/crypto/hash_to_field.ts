import { assert } from 'chai';
import {
    bigIntToBytes,
    bytesToBigInt,
    HashInfo,
    mod,
    q,
    sha256,
} from '../../internal.js';

export function I2OSP(value: bigint, length: number): Buffer {
    if (value < 0n || value >= 1n << (8n * BigInt(length)))
        throw new Error(`Bad I2OSP call: value=${value}, length=${length}.`);
    const bytes: Array<number> = [];
    for (let i = 0; i < length; i++) bytes.push(0);
    let tempValue = value;
    for (let i = length - 1; i >= 0; i--) {
        bytes[i] = Number(tempValue & 0xffn);
        tempValue >>= 8n;
    }
    const result = Buffer.from(bytes);
    const toBytesValue = bigIntToBytes(value, length, 'big');
    assert.deepEqual(result, toBytesValue);
    return result;
}

export function OS2IP(octets: Buffer): bigint {
    let result = 0n;
    for (const octet of octets) {
        result <<= 8n;
        result += BigInt(octet);
    }
    assert.equal(result, bytesToBigInt(octets, 'big'));
    return result;
}

export function bytesXor(a: Buffer, b: Buffer): Buffer {
    return Buffer.from(a.map((element, i) => element ^ b[i]));
}

export function expandMessageXmd(
    message: Buffer,
    dst: Buffer,
    length: number,
    hash: HashInfo
): Buffer {
    const ell = Math.trunc((length + hash.byteSize - 1) / hash.byteSize);
    if (ell > 255)
        throw new Error(`Bad expandMessageXmd call: ell=${ell} out of range.`);
    const dst_prime = [...dst, ...I2OSP(BigInt(dst.length), 1)];
    const Z_pad = I2OSP(0n, hash.blockSize);
    const lib_str = I2OSP(BigInt(length), 2);
    const b_0 = hash.convert(
        Buffer.from([
            ...Z_pad,
            ...message,
            ...lib_str,
            ...I2OSP(0n, 1),
            ...dst_prime,
        ])
    );
    const bValues: Array<Buffer> = [];
    bValues.push(
        hash.convert(Buffer.from([...b_0, ...I2OSP(1n, 1), ...dst_prime]))
    );
    for (let i = 1; i <= ell; i++) {
        bValues.push(
            hash.convert(
                Buffer.from([
                    ...bytesXor(b_0, bValues[i - 1]),
                    ...I2OSP(BigInt(i + 1), 1),
                    ...dst_prime,
                ])
            )
        );
    }
    const pseudoRandomBytes: Array<number> = [];
    for (const item of bValues) pseudoRandomBytes.push(...item);
    return Buffer.from(pseudoRandomBytes.slice(0, length));
}

export function expandMessageXof(
    message: Buffer,
    dst: Buffer,
    length: number,
    hash: HashInfo
): Buffer {
    const dst_prime = [...dst, ...I2OSP(BigInt(dst.length), 1)];
    const message_prime = [
        ...message,
        ...I2OSP(BigInt(length), 2),
        ...dst_prime,
    ];
    return hash.convert(Buffer.from(message_prime)).slice(0, length);
}

export function hashToField(
    message: Buffer,
    count: number,
    dst: Buffer,
    modulus: bigint,
    degree: number,
    byteLength: number,
    expand: (
        message: Buffer,
        dst: Buffer,
        length: number,
        hash: HashInfo
    ) => Buffer,
    hash: HashInfo
): bigint[][] {
    const lengthInBytes = count * degree * byteLength;
    const pseudoRandomBytes = expand(message, dst, lengthInBytes, hash);
    const uValues: Array<Array<bigint>> = [];
    for (let i = 0; i < count; i++) {
        const eValues: Array<bigint> = [];
        for (let j = 0; j < degree; j++) {
            const elmOffset = byteLength * (j + i * degree);
            const tv = pseudoRandomBytes.slice(
                elmOffset,
                elmOffset + byteLength
            );
            eValues.push(mod(OS2IP(tv), modulus));
        }
        uValues.push(eValues);
    }
    return uValues;
}

export function Hp(message: Buffer, count: number, dst: Buffer): bigint[][] {
    return hashToField(message, count, dst, q, 1, 64, expandMessageXmd, sha256);
}

export function Hp2(message: Buffer, count: number, dst: Buffer): bigint[][] {
    return hashToField(message, count, dst, q, 2, 64, expandMessageXmd, sha256);
}
