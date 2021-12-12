import { assert, AssertionError } from 'chai';
import {
    atePairingMulti,
    coreAggregateMpl,
    coreAggregateVerify,
    coreSignMpl,
    coreVerifyMpl,
    defaultEc,
    deriveChildG1Unhardened,
    deriveChildSk,
    deriveChildSkUnhardened,
    Fq12,
    g2Map,
    JacobianPoint,
    keyGen,
    popSchemeDst,
    popSchemePopDst,
    PrivateKey,
} from '../../internal.js';

export class PopSchemeMPL {
    public static keyGen(seed: Buffer): PrivateKey {
        return keyGen(seed);
    }

    public static sign(privateKey: PrivateKey, message: Buffer): JacobianPoint {
        return coreSignMpl(privateKey, message, popSchemeDst);
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(publicKey, message, signature, popSchemeDst);
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
            popSchemeDst
        );
    }

    public static popProve(privateKey: PrivateKey): JacobianPoint {
        const publicKey = privateKey.getG1();
        return g2Map(publicKey.toBytes(), popSchemePopDst).multiply(
            privateKey.value
        );
    }

    public static popVerify(
        publicKey: JacobianPoint,
        proof: JacobianPoint
    ): boolean {
        try {
            assert(proof.isValid());
            assert(publicKey.isValid());
            const q = g2Map(publicKey.toBytes(), popSchemePopDst);
            const one = Fq12.nil.one(defaultEc.q);
            const pairingResult = atePairingMulti(
                [publicKey, JacobianPoint.generateG1().negate()],
                [q, proof]
            );
            return pairingResult.equals(one);
        } catch (e) {
            if (e instanceof AssertionError) return false;
            throw e;
        }
    }

    public static fastAggregateVerify(
        publicKeys: JacobianPoint[],
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        if (!publicKeys.length) return false;
        let aggregate = publicKeys[0];
        for (const publicKey of publicKeys.slice(1))
            aggregate = aggregate.add(publicKey);
        return coreVerifyMpl(aggregate, message, signature, popSchemeDst);
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
