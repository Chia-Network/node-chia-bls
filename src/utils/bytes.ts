import { mod, modNumber } from '../internal.js';

export type Endian = 'little' | 'big';

export function flip(binary: string): string {
    return binary.replace(/[01]/g, (match) => (match === '0' ? '1' : '0'));
}

export function intBitLength(value: number): number {
    return Math.abs(value).toString(2).length;
}

export function bigIntBitLength(value: bigint): number {
    return (value < 0n ? -value : value).toString(2).length;
}

export function bigIntToBits(i: bigint): number[] {
    if (i < 1n) return [0];
    const bits: Array<number> = [];
    while (i !== 0n) {
        bits.push(Number(mod(i, 2n)));
        i /= 2n;
    }
    return bits.reverse();
}

export function intToBits(i: number): number[] {
    if (i < 1) return [0];
    const bits: Array<number> = [];
    while (i !== 0) {
        bits.push(Number(modNumber(i, 2)));
        i /= 2;
    }
    return bits.reverse();
}

export function intToBytes(
    value: number,
    size: number,
    endian: Endian,
    signed: boolean = false
): Buffer {
    if (value < 0 && !signed)
        throw new Error('Cannot convert negative number to unsigned.');
    if (Math.floor(value) !== value)
        throw new Error('Cannot convert floating point number.');
    let binary = Math.abs(value)
        .toString(2)
        .padStart(size * 8, '0');
    if (value < 0) {
        binary = (parseInt(flip(binary), 2) + 1)
            .toString(2)
            .padStart(size * 8, '0');
    }
    var bytes = binary.match(/[01]{8}/g)!.map((match) => parseInt(match, 2));
    if (endian === 'little') bytes.reverse();
    return Buffer.from(bytes);
}

export function bytesToInt(
    bytes: Buffer,
    endian: Endian,
    signed: boolean = false
): number {
    if (bytes.length === 0) return 0;
    const sign = bytes[endian === 'little' ? bytes.length - 1 : 0]
        .toString(2)
        .padStart(8, '0')[0];
    const byteList = endian === 'little' ? bytes.reverse() : bytes;
    let binary = '';
    for (const byte of byteList) binary += byte.toString(2).padStart(8, '0');
    if (sign === '1' && signed) {
        binary = (parseInt(flip(binary), 2) + 1)
            .toString(2)
            .padStart(bytes.length * 8, '0');
    }
    const result = parseInt(binary, 2);
    return sign === '1' && signed ? -result : result;
}

export function encodeInt(value: number): Buffer {
    if (value === 0) return Buffer.from([]);
    const length = (intBitLength(value) + 8) >> 3;
    let bytes = intToBytes(value, length, 'big', true);
    while (
        bytes.length > 1 &&
        bytes[0] === ((bytes[1] & 0x80) !== 0 ? 0xff : 0)
    )
        bytes = bytes.slice(1);
    return bytes;
}

export function decodeInt(bytes: Buffer): number {
    return bytesToInt(bytes, 'big', true);
}

export function bigIntToBytes(
    value: bigint,
    size: number,
    endian: Endian,
    signed: boolean = false
): Buffer {
    if (value < 0n && !signed)
        throw new Error('Cannot convert negative number to unsigned.');
    let binary = (value < 0n ? -value : value)
        .toString(2)
        .padStart(size * 8, '0');
    if (value < 0) {
        binary = (BigInt('0b' + flip(binary)) + 1n)
            .toString(2)
            .padStart(size * 8, '0');
    }
    var bytes = binary.match(/[01]{8}/g)!.map((match) => parseInt(match, 2));
    if (endian === 'little') bytes.reverse();
    return Buffer.from(bytes);
}

export function bytesToBigInt(
    bytes: Buffer,
    endian: Endian,
    signed: boolean = false
): bigint {
    if (bytes.length === 0) return 0n;
    const sign = bytes[endian === 'little' ? bytes.length - 1 : 0]
        .toString(2)
        .padStart(8, '0')[0];
    const byteList = endian === 'little' ? bytes.reverse() : bytes;
    let binary = '';
    for (const byte of byteList) binary += byte.toString(2).padStart(8, '0');
    if (sign === '1' && signed) {
        binary = (BigInt('0b' + flip(binary)) + 1n)
            .toString(2)
            .padStart(bytes.length * 8, '0');
    }
    const result = BigInt('0b' + binary);
    return sign === '1' && signed ? -result : result;
}

export function encodeBigInt(value: bigint): Buffer {
    if (value === 0n) return Buffer.from([]);
    const length = (bigIntBitLength(value) + 8) >> 3;
    let bytes = bigIntToBytes(value, length, 'big', true);
    while (
        bytes.length > 1 &&
        bytes[0] === ((bytes[1] & 0x80) !== 0 ? 0xff : 0)
    )
        bytes = bytes.slice(1);
    return bytes;
}

export function decodeBigInt(bytes: Buffer): bigint {
    return bytesToBigInt(bytes, 'big', true);
}

export function concatBytes(...lists: Buffer[]): Buffer {
    const bytes: Array<number> = [];
    for (const list of lists) {
        for (const byte of list) bytes.push(byte);
    }
    return Buffer.from(bytes);
}
