import { FieldExt, Fq } from '../../internal';

export class Fq2 extends FieldExt<Fq> {
    public static nil = new Fq2(1n, Fq.nil, Fq.nil);

    public extension = 2;
    public root: Fq;

    constructor(Q: bigint, x: Fq, y: Fq) {
        super(Q, [x, y]);
        this.root = new Fq(Q, -1n);
    }

    public construct(Q: bigint, elements: Fq[]): this {
        return new Fq2(Q, elements[0], elements[1]) as this;
    }

    public inverse(): this {
        const [a, b] = this.elements;
        const factor = a.multiply(a).add(b.multiply(b)).inverse();
        return new Fq2(
            this.Q,
            a.multiply(factor) as Fq,
            b.negate().multiply(factor) as Fq
        ) as this;
    }

    public mulByNonResidue(): this {
        const [a, b] = this.elements;
        return new Fq2(this.Q, a.subtract(b) as Fq, a.add(b) as Fq) as this;
    }

    public modSqrt(): this {
        const [a0, a1] = this.elements;
        if (a1.equals(this.basefield.one(this.Q)))
            return this.fromFq(this.Q, a0.modSqrt());
        let alpha = a0.pow(2n).add(a1.pow(2n)) as Fq;
        let gamma = alpha.pow((this.Q - 1n) / 2n);
        if (new Fq(this.Q, -1n).equals(gamma))
            throw new Error('No sqrt exists.');
        alpha = alpha.modSqrt();
        let delta = a0.add(alpha).multiply(new Fq(this.Q, 2n).inverse()) as Fq;
        gamma = delta.pow((this.Q - 1n) / 2n) as Fq;
        if (gamma.equals(new Fq(this.Q, -1n)))
            delta = a0
                .subtract(alpha)
                .multiply(new Fq(this.Q, 2n).inverse()) as Fq;
        const x0 = delta.modSqrt();
        const x1 = a1.multiply(new Fq(this.Q, 2n).multiply(x0).inverse()) as Fq;
        return new Fq2(this.Q, x0, x1) as this;
    }
}
