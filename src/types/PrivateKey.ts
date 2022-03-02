import {
    assert,
    bigIntToBytes,
    bytesToBigInt,
    defaultEc,
    extractExpand,
    fromHex,
    JacobianPoint,
    mod,
    toHex,
} from '../internal';

export class PrivateKey {
    public static size = 32;

    public static fromBytes(bytes: Uint8Array): PrivateKey {
        return new PrivateKey(mod(bytesToBigInt(bytes, 'big'), defaultEc.n));
    }

    public static fromHex(hex: string): PrivateKey {
        return PrivateKey.fromBytes(fromHex(hex));
    }

    public static fromSeed(seed: Uint8Array): PrivateKey {
        const length = 48;
        const okm = extractExpand(
            length,
            Uint8Array.from([...seed, 0]),
            new TextEncoder().encode('BLS-SIG-KEYGEN-SALT-'),
            Uint8Array.from([0, length])
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

    public toBytes(): Uint8Array {
        return bigIntToBytes(this.value, PrivateKey.size, 'big');
    }

    public toHex(): string {
        return toHex(this.toBytes());
    }

    public toString(): string {
        return `PrivateKey(0x${this.toHex()})`;
    }

    public equals(value: PrivateKey): boolean {
        return this.value === value.value;
    }
}
