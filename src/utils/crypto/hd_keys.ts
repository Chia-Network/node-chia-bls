import {
    bytesToBigInt,
    defaultEc,
    extractExpand,
    hash256,
    intToBytes,
    JacobianPoint,
    mod,
    PrivateKey,
} from '../../internal.js';

export function keyGen(seed: Buffer): PrivateKey {
    const length = 48;
    const okm = extractExpand(
        length,
        Buffer.from([...seed, 0]),
        Buffer.from('BLS-SIG-KEYGEN-SALT-', 'utf-8'),
        Buffer.from([0, length])
    );
    return new PrivateKey(mod(bytesToBigInt(okm, 'big'), defaultEc.n));
}

export function ikmToLamportSk(ikm: Buffer, salt: Buffer): Buffer {
    return extractExpand(32 * 255, ikm, salt, Buffer.from([]));
}

export function parentSkToLamportPk(
    parentSk: PrivateKey,
    index: number
): Buffer {
    const salt = intToBytes(index, 4, 'big');
    const ikm = parentSk.toBytes();
    const notIkm = Buffer.from(ikm.map((e) => e ^ 0xff));
    const lamport0 = ikmToLamportSk(ikm, salt);
    const lamport1 = ikmToLamportSk(notIkm, salt);
    const lamportPk: Array<number> = [];
    for (let i = 0; i < 255; i++)
        lamportPk.push(...hash256(lamport0.slice(i * 32, (i + 1) * 32)));
    for (let i = 0; i < 255; i++)
        lamportPk.push(...hash256(lamport1.slice(i * 32, (i + 1) * 32)));
    return hash256(Buffer.from(lamportPk));
}

export function deriveChildSk(parentSk: PrivateKey, index: number): PrivateKey {
    return keyGen(parentSkToLamportPk(parentSk, index));
}

export function deriveChildSkUnhardened(
    parentSk: PrivateKey,
    index: number
): PrivateKey {
    const hash = hash256(
        Buffer.from([
            ...parentSk.getG1().toBytes(),
            ...intToBytes(index, 4, 'big'),
        ])
    );
    return PrivateKey.aggregate([PrivateKey.fromBytes(hash), parentSk]);
}

export function deriveChildG1Unhardened(
    parentPk: JacobianPoint,
    index: number
): JacobianPoint {
    const hash = hash256(
        Buffer.from([...parentPk.toBytes(), ...intToBytes(index, 4, 'big')])
    );
    return parentPk.add(
        JacobianPoint.generateG1().multiply(PrivateKey.fromBytes(hash).value)
    );
}

export function deriveChildG2Unhardened(
    parentPk: JacobianPoint,
    index: number
): JacobianPoint {
    const hash = hash256(
        Buffer.from([...parentPk.toBytes(), ...intToBytes(index, 4, 'big')])
    );
    return parentPk.add(
        JacobianPoint.generateG2().multiply(PrivateKey.fromBytes(hash).value)
    );
}
