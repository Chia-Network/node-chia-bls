import {
    basicSchemeDst,
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

export class BasicSchemeMPL {
    public static keyGen(seed: Buffer): PrivateKey {
        return keyGen(seed);
    }

    public static sign(privateKey: PrivateKey, message: Buffer): JacobianPoint {
        return coreSignMpl(privateKey, message, basicSchemeDst);
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(publicKey, message, signature, basicSchemeDst);
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
        for (const message of messages) {
            for (const match of messages) {
                if (message !== match && message.equals(match)) return false;
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
