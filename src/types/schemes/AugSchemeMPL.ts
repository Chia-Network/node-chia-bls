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
} from '../../internal';

export class AugSchemeMPL {
    public static keyGen(seed: Uint8Array): PrivateKey {
        return keyGen(seed);
    }

    public static sign(
        privateKey: PrivateKey,
        message: Uint8Array
    ): JacobianPoint {
        const publicKey = privateKey.getG1();
        return coreSignMpl(
            privateKey,
            Uint8Array.from([...publicKey.toBytes(), ...message]),
            augSchemeDst
        );
    }

    public static sign_prepend(
        privateKey: PrivateKey,
        message: Uint8Array,
        prependPublicKey: JacobianPoint
    ): JacobianPoint {
        return coreSignMpl(
            privateKey,
            Uint8Array.from([...prependPublicKey.toBytes(), ...message]),
            augSchemeDst
        );
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Uint8Array,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(
            publicKey,
            Uint8Array.from([...publicKey.toBytes(), ...message]),
            signature,
            augSchemeDst
        );
    }

    public static aggregate(signatures: JacobianPoint[]): JacobianPoint {
        return coreAggregateMpl(signatures);
    }

    public static aggregateVerify(
        publicKeys: JacobianPoint[],
        messages: Uint8Array[],
        signature: JacobianPoint
    ): boolean {
        if (publicKeys.length !== messages.length || !publicKeys.length)
            return false;
        const mPrimes: Array<Uint8Array> = [];
        for (let i = 0; i < publicKeys.length; i++)
            mPrimes.push(
                Uint8Array.from([...publicKeys[i].toBytes(), ...messages[i]])
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
