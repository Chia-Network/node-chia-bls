import {
    assert,
    defaultEcTwist,
    Ell2p_a,
    Ell2p_b,
    etas,
    evalIso,
    Fq,
    Fq2,
    hEff,
    Hp2,
    JacobianPoint,
    mod,
    q,
    rootsOfUnity,
    xden,
    xi_2,
    xnum,
    yden,
    ynum,
} from '../../internal';

export function sgn0(x: Fq2): bigint {
    const sign0 = mod(x.elements[0].value, 2n) === 1n;
    const zero0 = x.elements[0].value === 0n;
    const sign1 = mod(x.elements[1].value, 2n) === 1n;
    return sign0 || (zero0 && sign1) ? 1n : 0n;
}

export function osswu2Help(t: Fq2): JacobianPoint {
    const numDenCommon = xi_2
        .pow(2n)
        .multiply(t.pow(4n))
        .add(xi_2.multiply(t.pow(2n)));
    const x0_num = Ell2p_b.multiply(numDenCommon.add(new Fq(q, 1n)));
    let x0_den = Ell2p_a.negate().multiply(numDenCommon);
    x0_den = x0_den.equals(0n) ? Ell2p_a.multiply(xi_2) : x0_den;
    const gx0_den = x0_den.pow(3n);
    const gx0_num = Ell2p_b.multiply(gx0_den)
        .add(Ell2p_a.multiply(x0_num).multiply(x0_den.pow(2n)))
        .add(x0_num.pow(3n));
    let temp1 = gx0_den.pow(7n);
    const temp2 = gx0_num.multiply(temp1);
    temp1 = temp1.multiply(temp2).multiply(gx0_den);
    let sqrtCandidate = temp2.multiply(temp1.pow((q ** 2n - 9n) / 16n));
    for (const root of rootsOfUnity) {
        let y0 = sqrtCandidate.multiply(root) as Fq2;
        if (y0.pow(2n).multiply(gx0_den).equals(gx0_num)) {
            if (sgn0(y0) !== sgn0(t)) y0 = y0.negate();
            assert(sgn0(y0) === sgn0(t));
            return new JacobianPoint(
                x0_num.multiply(x0_den) as Fq | Fq2,
                y0.multiply(x0_den.pow(3n)) as Fq | Fq2,
                x0_den as Fq | Fq2,
                false,
                defaultEcTwist
            );
        }
    }
    const x1_num = xi_2.multiply(t.pow(2n)).multiply(x0_num);
    const x1_den = x0_den;
    const gx1_num = xi_2.pow(3n).multiply(t.pow(6n)).multiply(gx0_num);
    const gx1_den = gx0_den;
    sqrtCandidate = sqrtCandidate.multiply(t.pow(3n));
    for (const eta of etas) {
        let y1 = eta.multiply(sqrtCandidate) as Fq2;
        if (y1.pow(2n).multiply(gx1_den).equals(gx1_num)) {
            if (sgn0(y1) !== sgn0(t)) y1 = y1.negate();
            assert(sgn0(y1) === sgn0(t));
            return new JacobianPoint(
                x1_num.multiply(x1_den) as Fq | Fq2,
                y1.multiply(x1_den.pow(3n)) as Fq | Fq2,
                x1_den as Fq | Fq2,
                false,
                defaultEcTwist
            );
        }
    }
    throw new Error('Bad osswu2Help.');
}

export function iso3(P: JacobianPoint): JacobianPoint {
    return evalIso(P, [xnum, xden, ynum, yden], defaultEcTwist);
}

export function optSwu2Map(t: Fq2, t2?: Fq2): JacobianPoint {
    let Pp = iso3(osswu2Help(t));
    if (t2) {
        const Pp2 = iso3(osswu2Help(t2));
        Pp = Pp.add(Pp2);
    }
    return Pp.multiply(hEff);
}

export function g2Map(alpha: Uint8Array, dst: Uint8Array): JacobianPoint {
    const elements = Hp2(alpha, 2, dst).map((hh) => {
        const items = hh.map((value) => new Fq(q, value));
        return new Fq2(q, items[0], items[1]);
    });
    return optSwu2Map(elements[0], elements[1]);
}
