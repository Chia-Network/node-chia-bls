import {
    basicSchemeDst,
    bytesEqual,
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

export class BasicSchemeMPL {
    public static keyGen(seed: Uint8Array): PrivateKey {
        return keyGen(seed);
    }

    public static sign(
        privateKey: PrivateKey,
        message: Uint8Array
    ): JacobianPoint {
        return coreSignMpl(privateKey, message, basicSchemeDst);
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Uint8Array,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(publicKey, message, signature, basicSchemeDst);
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
        for (const message of messages) {
            for (const match of messages) {
                if (message !== match && bytesEqual(message, match))
                    return false;
            }
        }
        return coreAggregateVerify(
            publicKeys,
            messages,
            signature,
            basicSchemeDst
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
