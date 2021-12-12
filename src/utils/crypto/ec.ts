import { assert } from 'chai';
import {
    AffinePoint,
    defaultEc,
    defaultEcTwist,
    EC,
    Fq,
    Fq2,
    JacobianPoint,
    mod,
} from '../../internal.js';

export function yForX(x: Fq | Fq2, ec: EC = defaultEc): Fq | Fq2 {
    const u = x.multiply(x).multiply(x).add(ec.a.multiply(x)).add(ec.b) as
        | Fq
        | Fq2;
    const y = u.modSqrt();
    if (y.equals(0n) || !new AffinePoint(x, y, false, ec).isOnCurve())
        throw new Error('No y for point x.');
    return y;
}

export function scalarMultJacobian(
    value: Fq | bigint,
    point: JacobianPoint,
    ec: EC = defaultEc
): JacobianPoint {
    if (value instanceof Fq) value = value.value;
    let result = new JacobianPoint(
        point.x.one(ec.q),
        point.x.one(ec.q),
        point.x.zero(ec.q),
        true,
        ec
    );
    if (point.isInfinity || mod(value, ec.q) === 0n) return result;
    let addend = point;
    while (value > 0n) {
        if (value & 1n) result = result.add(addend);
        addend = addend.add(addend);
        value >>= 1n;
    }
    return result;
}

export function evalIso(
    P: JacobianPoint,
    mapCoeffs: Fq2[][],
    ec: EC
): JacobianPoint {
    const { x, y, z } = P;
    const mapValues: Array<Fq2 | null> = [null, null, null, null];
    let maxOrd = mapCoeffs[0].length;
    for (const coeffs of mapCoeffs.slice(1))
        maxOrd = Math.max(maxOrd, coeffs.length);
    const zPows: Array<Fq2 | null> = [];
    for (let i = 0; i < maxOrd; i++) zPows.push(null);
    zPows[0] = z.pow(0n) as Fq2;
    zPows[1] = z.pow(2n) as Fq2;
    for (let i = 2; i < zPows.length; i++) {
        assert.notEqual(zPows[i - 1], null);
        assert.notEqual(zPows[1], null);
        zPows[i] = zPows[i - 1]?.multiply(zPows[1]) as Fq2;
    }
    for (const [i, item] of mapCoeffs.entries()) {
        const coeffsZ = item
            .slice()
            .reverse()
            .map((item, i) => item.multiply(zPows[i]!));
        let temp = coeffsZ[0];
        for (const coeff of coeffsZ.slice(1)) {
            temp = temp.multiply(x);
            temp = temp.add(coeff);
        }
        mapValues[i] = temp as Fq2;
    }
    assert.equal(mapCoeffs[1].length + 1, mapCoeffs[0].length);
    assert.notEqual(zPows[1], null);
    assert.notEqual(mapValues[1], null);
    mapValues[1] = mapValues[1]?.multiply(zPows[1]) as Fq2;
    assert.notEqual(mapValues[2], null);
    assert.notEqual(mapValues[3], null);
    mapValues[2] = mapValues[2]!.multiply(y) as Fq2;
    mapValues[3] = mapValues[3]!.multiply(z.pow(3n)) as Fq2;
    const Z = mapValues[1].multiply(mapValues[3]);
    const X = mapValues[0]!.multiply(mapValues[3]).multiply(Z);
    const Y = mapValues[2].multiply(mapValues[1]).multiply(Z).multiply(Z);
    return new JacobianPoint(
        X as Fq | Fq2,
        Y as Fq | Fq2,
        Z as Fq | Fq2,
        P.isInfinity,
        ec
    );
}

export function signFq(element: Fq, ec: EC = defaultEc): boolean {
    return element.gt(new Fq(ec.q, (ec.q - 1n) / 2n));
}

export function signFq2(element: Fq2, ec: EC = defaultEcTwist): boolean {
    if (element.elements[1].equals(new Fq(ec.q, 0n)))
        return signFq(element.elements[0]);
    return element.elements[1].gt(new Fq(ec.q, (ec.q - 1n) / 2n));
}
