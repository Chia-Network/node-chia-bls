import { mod, modNumber } from '../internal';

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
): Uint8Array {
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
    return Uint8Array.from(bytes);
}

export function bytesToInt(
    bytes: Uint8Array,
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

export function encodeInt(value: number): Uint8Array {
    if (value === 0) return Uint8Array.from([]);
    const length = (intBitLength(value) + 8) >> 3;
    let bytes = intToBytes(value, length, 'big', true);
    while (
        bytes.length > 1 &&
        bytes[0] === ((bytes[1] & 0x80) !== 0 ? 0xff : 0)
    )
        bytes = bytes.slice(1);
    return bytes;
}

export function decodeInt(bytes: Uint8Array): number {
    return bytesToInt(bytes, 'big', true);
}

export function bigIntToBytes(
    value: bigint,
    size: number,
    endian: Endian,
    signed: boolean = false
): Uint8Array {
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
    return Uint8Array.from(bytes);
}

export function bytesToBigInt(
    bytes: Uint8Array,
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

export function encodeBigInt(value: bigint): Uint8Array {
    if (value === 0n) return Uint8Array.from([]);
    const length = (bigIntBitLength(value) + 8) >> 3;
    let bytes = bigIntToBytes(value, length, 'big', true);
    while (
        bytes.length > 1 &&
        bytes[0] === ((bytes[1] & 0x80) !== 0 ? 0xff : 0)
    )
        bytes = bytes.slice(1);
    return bytes;
}

export function decodeBigInt(bytes: Uint8Array): bigint {
    return bytesToBigInt(bytes, 'big', true);
}

export function concatBytes(...lists: Uint8Array[]): Uint8Array {
    const bytes: Array<number> = [];
    for (const list of lists) {
        for (const byte of list) bytes.push(byte);
    }
    return Uint8Array.from(bytes);
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    return (
        a.length === b.length && a.findIndex((byte, i) => b[i] !== byte) === -1
    );
}

const HEX_STRINGS = '0123456789abcdef';
const MAP_HEX: Record<string, number> = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
};

export function toHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map((b) => HEX_STRINGS[b >> 4] + HEX_STRINGS[b & 15])
        .join('');
}

export function fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(Math.floor(hex.length / 2));
    let i;
    for (i = 0; i < bytes.length; i++) {
        const a = MAP_HEX[hex[i * 2]];
        const b = MAP_HEX[hex[i * 2 + 1]];
        if (a === undefined || b === undefined) {
            break;
        }
        bytes[i] = (a << 4) | b;
    }
    return i === bytes.length ? bytes : bytes.slice(0, i);
}
