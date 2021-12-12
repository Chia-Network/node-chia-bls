import { assert } from 'chai';
import {
    bigIntToBytes,
    bytesToBigInt,
    defaultEc,
    extractExpand,
    JacobianPoint,
    mod,
} from '../internal.js';

export class PrivateKey {
    public static size = 32;

    public static fromBytes(bytes: Buffer): PrivateKey {
        return new PrivateKey(mod(bytesToBigInt(bytes, 'big'), defaultEc.n));
    }

    public static fromHex(hex: string): PrivateKey {
        return PrivateKey.fromBytes(Buffer.from(hex, 'hex'));
    }

    public static fromSeed(seed: Buffer): PrivateKey {
        const length = 48;
        const okm = extractExpand(
            length,
            Buffer.from([...seed, 0]),
            Buffer.from('BLS-SIG-KEYGEN-SALT-', 'utf-8'),
            Buffer.from([0, length])
        );
        return new PrivateKey(mod(bytesToBigInt(okm, 'big'), defaultEc.n));
    }

    public static fromBigInt(value: bigint): PrivateKey {
        return new PrivateKey(mod(value, defaultEc.n));
    }

    public static aggregate(privateKeys: PrivateKey[]): PrivateKey {
        return new PrivateKey(
            mod(
                privateKeys.reduce(
                    (aggregate, privateKey) => aggregate + privateKey.value,
                    0n
                ),
                defaultEc.n
            )
        );
    }

    constructor(public value: bigint) {
        assert(value < defaultEc.n);
    }

    public getG1(): JacobianPoint {
        return JacobianPoint.generateG1().multiply(this.value);
    }

    public toBytes(): Buffer {
        return bigIntToBytes(this.value, PrivateKey.size, 'big');
    }

    public toHex(): string {
        return this.toBytes().toString('hex');
    }

    public toString(): string {
        return `PrivateKey(0x${this.toHex()})`;
    }

    public equals(value: PrivateKey): boolean {
        return this.value === value.value;
    }
}
