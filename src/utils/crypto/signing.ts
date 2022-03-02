import {
    assert,
    atePairingMulti,
    defaultEc,
    Fq12,
    g2Map,
    JacobianPoint,
    PrivateKey,
} from '../../internal';

export function coreSignMpl(
    sk: PrivateKey,
    message: Uint8Array,
    dst: Uint8Array
): JacobianPoint {
    return g2Map(message, dst).multiply(sk.value);
}

export function coreVerifyMpl(
    pk: JacobianPoint,
    message: Uint8Array,
    signature: JacobianPoint,
    dst: Uint8Array
): boolean {
    if (!signature.isValid() || !pk.isValid()) return false;
    const q = g2Map(message, dst);
    const one = Fq12.nil.one(defaultEc.q);
    const pairingResult = atePairingMulti(
        [pk, JacobianPoint.generateG1().negate()],
        [q, signature]
    );
    return pairingResult.equals(one);
}

export function coreAggregateMpl(signatures: JacobianPoint[]): JacobianPoint {
    if (!signatures.length)
        throw new Error('Must aggregate at least 1 signature.');
    let aggregate = signatures[0];
    assert(aggregate.isValid());
    for (const signature of signatures.slice(1)) {
        assert(signature.isValid());
        aggregate = aggregate.add(signature);
    }
    return aggregate;
}

export function coreAggregateVerify(
    pks: JacobianPoint[],
    ms: Uint8Array[],
    signature: JacobianPoint,
    dst: Uint8Array
): boolean {
    if (pks.length !== ms.length || !pks.length) return false;
    if (!signature.isValid()) return false;
    const qs = [signature];
    const ps = [JacobianPoint.generateG1().negate()];
    for (let i = 0; i < pks.length; i++) {
        if (!pks[i].isValid()) return false;
        qs.push(g2Map(ms[i], dst));
        ps.push(pks[i]);
    }
    return Fq12.nil.one(defaultEc.q).equals(atePairingMulti(ps, qs));
}
