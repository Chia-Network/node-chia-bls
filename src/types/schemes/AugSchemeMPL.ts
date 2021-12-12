import {
    augSchemeDst,
    coreAggregateMpl,
    coreAggregateVerify,
    coreSignMpl,
    coreVerifyMpl,
    deriveChildG1Unhardened,
    deriveChildSk,
    deriveChildSkUnhardened,
    JacobianPoint,
    keyGen,
    PrivateKey,
} from '../../internal.js';

export class AugSchemeMPL {
    public static keyGen(seed: Buffer): PrivateKey {
        return keyGen(seed);
    }

    public static sign(privateKey: PrivateKey, message: Buffer): JacobianPoint {
        const publicKey = privateKey.getG1();
        return coreSignMpl(
            privateKey,
            Buffer.from([...publicKey.toBytes(), ...message]),
            augSchemeDst
        );
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(
            publicKey,
            Buffer.from([...publicKey.toBytes(), ...message]),
            signature,
            augSchemeDst
        );
    }

    public static aggregate(signatures: JacobianPoint[]): JacobianPoint {
        return coreAggregateMpl(signatures);
    }

    public static aggregateVerify(
        publicKeys: JacobianPoint[],
        messages: Buffer[],
        signature: JacobianPoint
    ): boolean {
        if (publicKeys.length !== messages.length || !publicKeys.length)
            return false;
        const mPrimes: Array<Buffer> = [];
        for (let i = 0; i < publicKeys.length; i++)
            mPrimes.push(
                Buffer.from([...publicKeys[i].toBytes(), ...messages[i]])
            );
        return coreAggregateVerify(
            publicKeys,
            mPrimes,
            signature,
            augSchemeDst
        );
    }

    public static deriveChildSk(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSk(privateKey, index);
    }

    public static deriveChildSkUnhardened(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSkUnhardened(privateKey, index);
    }

    public static deriveChildPkUnhardened(
        publicKey: JacobianPoint,
        index: number
    ): JacobianPoint {
        return deriveChildG1Unhardened(publicKey, index);
    }
}
