import { FieldExt, Fq2, Fq6 } from '../../internal.js';

export class Fq12 extends FieldExt<Fq6> {
    public static nil = new Fq12(1n, Fq6.nil, Fq6.nil);

    public extension = 12;
    public root: Fq6;

    constructor(Q: bigint, x: Fq6, y: Fq6) {
        super(Q, [x, y]);
        this.root = new Fq6(
            Q,
            Fq2.nil.zero(Q),
            Fq2.nil.one(Q),
            Fq2.nil.zero(Q)
        );
    }

    public construct(Q: bigint, elements: Fq6[]): this {
        return new Fq12(Q, elements[0], elements[1]) as this;
    }

    public inverse(): this {
        const [a, b] = this.elements;
        const factor = a
            .multiply(a)
            .subtract((b.multiply(b) as Fq6).mulByNonResidue())
            .inverse();
        return new Fq12(
            this.Q,
            a.multiply(factor) as Fq6,
            b.negate().multiply(factor) as Fq6
        ) as this;
    }
}
