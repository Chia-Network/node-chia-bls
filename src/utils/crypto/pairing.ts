import {
    AffinePoint,
    bigIntToBits,
    defaultEc,
    EC,
    Fq,
    Fq12,
    Fq2,
    JacobianPoint,
} from '../../internal.js';

export function doubleLineEval(
    R: AffinePoint,
    P: AffinePoint,
    ec: EC = defaultEc
): Fq | Fq2 {
    const R12 = R.untwist();
    const slope = new Fq(ec.q, 3n)
        .multiply(R12.x.pow(2n).add(ec.a))
        .divide(R12.y.multiply(new Fq(ec.q, 2n)));
    const v = R12.y.subtract(R12.x.multiply(slope));
    return P.y.subtract(P.x.multiply(slope)).subtract(v) as Fq | Fq2;
}

export function addLineEval(
    R: AffinePoint,
    Q: AffinePoint,
    P: AffinePoint
): Fq | Fq2 {
    const R12 = R.untwist();
    const Q12 = Q.untwist();
    if (R12.equals(Q12.negate())) return P.x.subtract(R12.x) as Fq | Fq2;
    const slope = Q12.y.subtract(R12.y).divide(Q12.x.subtract(R12.x));
    const v = Q12.y
        .multiply(R12.x)
        .subtract(R12.y.multiply(Q12.x))
        .divide(R12.x.subtract(Q12.x));
    return P.y.subtract(P.x.multiply(slope)).subtract(v) as Fq | Fq2;
}

export function millerLoop(
    T: bigint,
    P: AffinePoint,
    Q: AffinePoint,
    ec: EC = defaultEc
): Fq12 {
    const T_bits = bigIntToBits(T);
    let R = Q;
    let f = Fq12.nil.one(ec.q);
    for (let i = 1; i < T_bits.length; i++) {
        const lrr = doubleLineEval(R, P, ec);
        f = f.multiply(f).multiply(lrr) as Fq12;
        R = R.multiply(new Fq(ec.q, 2n));
        if (T_bits[i] === 1) {
            const lrq = addLineEval(R, Q, P);
            f = f.multiply(lrq) as Fq12;
            R = R.add(Q);
        }
    }
    return f;
}

export function finalExponentiation(element: Fq12, ec: EC = defaultEc): Fq12 {
    if (ec.k === 12n) {
        let ans = element.pow((ec.q ** 4n - ec.q ** 2n + 1n) / ec.n);
        ans = ans.qiPower(2).multiply(ans) as Fq12;
        ans = ans.qiPower(6).divide(ans) as Fq12;
        return ans;
    } else return element.pow((ec.q ** ec.k - 1n) / ec.n);
}

export function atePairing(
    P: JacobianPoint,
    Q: JacobianPoint,
    ec: EC = defaultEc
): Fq12 {
    const t = defaultEc.x + 1n;
    let T = t - 1n;
    T = T < 0n ? -T : T;
    return finalExponentiation(millerLoop(T, P.toAffine(), Q.toAffine()), ec);
}

export function atePairingMulti(
    Ps: JacobianPoint[],
    Qs: JacobianPoint[],
    ec: EC = defaultEc
): Fq12 {
    const t = defaultEc.x + 1n;
    let T = t - 1n;
    T = T < 0n ? -T : T;
    let prod = Fq12.nil.one(ec.q);
    for (let i = 0; i < Qs.length; i++) {
        prod = prod.multiply(
            millerLoop(T, Ps[i].toAffine(), Qs[i].toAffine(), ec)
        ) as Fq12;
    }
    return finalExponentiation(prod, ec);
}
