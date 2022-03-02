import { FieldExt, Fq, Fq2 } from '../../internal';

export class Fq6 extends FieldExt<Fq2> {
    public static nil = new Fq6(1n, Fq2.nil, Fq2.nil, Fq2.nil);

    public extension = 6;
    public root: Fq2;

    constructor(Q: bigint, x: Fq2, y: Fq2, z: Fq2) {
        super(Q, [x, y, z]);
        this.root = new Fq2(Q, Fq.nil.one(Q), Fq.nil.one(Q));
    }

    public construct(Q: bigint, elements: Fq2[]): this {
        return new Fq6(Q, elements[0], elements[1], elements[2]) as this;
    }

    public inverse(): this {
        const [a, b, c] = this.elements;
        const g0 = a.multiply(a).subtract(b.multiply(c.mulByNonResidue()));
        const g1 = (c.multiply(c) as Fq2)
            .mulByNonResidue()
            .subtract(a.multiply(b));
        const g2 = b.multiply(b).subtract(a.multiply(c));
        const factor = g0
            .multiply(a)
            .add((g1.multiply(c).add(g2.multiply(b)) as Fq2).mulByNonResidue())
            .inverse();
        return new Fq6(
            this.Q,
            g0.multiply(factor) as Fq2,
            g1.multiply(factor) as Fq2,
            g2.multiply(factor) as Fq2
        ) as this;
    }

    public mulByNonResidue(): this {
        const [a, b, c] = this.elements;
        return new Fq6(this.Q, c.multiply(this.root) as Fq2, a, b) as this;
    }
}
