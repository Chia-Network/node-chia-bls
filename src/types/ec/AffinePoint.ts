import { assert } from 'chai';
import {
    defaultEc,
    EC,
    Fq,
    Fq12,
    Fq2,
    Fq6,
    JacobianPoint,
    scalarMultJacobian,
} from '../../internal.js';

export class AffinePoint {
    constructor(
        public x: Fq | Fq2,
        public y: Fq | Fq2,
        public isInfinity: boolean,
        public ec: EC = defaultEc
    ) {
        assert(x instanceof y.constructor);
    }

    public isOnCurve(): boolean {
        return (
            this.isInfinity ||
            this.y
                .multiply(this.y)
                .equals(
                    this.x
                        .multiply(this.x)
                        .multiply(this.x)
                        .add(this.ec.a.multiply(this.x))
                        .add(this.ec.b)
                )
        );
    }

    public toJacobian(): JacobianPoint {
        return new JacobianPoint(
            this.x,
            this.y,
            this.x.one(this.ec.q),
            this.isInfinity,
            this.ec
        );
    }

    public twist(): AffinePoint {
        const f = Fq12.nil.one(this.ec.q);
        const wsq = new Fq12(this.ec.q, f.root, Fq6.nil.zero(this.ec.q));
        const wcu = new Fq12(this.ec.q, Fq6.nil.zero(this.ec.q), f.root);
        return new AffinePoint(
            this.x.multiply(wsq) as Fq | Fq2,
            this.y.multiply(wcu) as Fq | Fq2,
            false,
            this.ec
        );
    }

    public untwist(): AffinePoint {
        const f = Fq12.nil.one(this.ec.q);
        const wsq = new Fq12(this.ec.q, f.root, Fq6.nil.zero(this.ec.q));
        const wcu = new Fq12(this.ec.q, Fq6.nil.zero(this.ec.q), f.root);
        return new AffinePoint(
            this.x.divide(wsq) as Fq | Fq2,
            this.y.divide(wcu) as Fq | Fq2,
            false,
            this.ec
        );
    }

    public double(): AffinePoint {
        const left = this.x
            .multiply(this.x)
            .multiply(new Fq(this.ec.q, 3n))
            .add(this.ec.a);
        const s = left.divide(this.y.multiply(new Fq(this.ec.q, 2n)));
        const newX = s.multiply(s).subtract(this.x).subtract(this.x);
        const newY = s.multiply(this.x.subtract(newX)).subtract(this.y);
        return new AffinePoint(
            newX as Fq | Fq2,
            newY as Fq | Fq2,
            false,
            this.ec
        );
    }

    public add(value: AffinePoint): AffinePoint {
        assert(this.isOnCurve());
        assert(value.isOnCurve());
        if (this.isInfinity) return value;
        else if (value.isInfinity) return this;
        else if (this.equals(value)) return this.double();
        const s = value.y.subtract(this.y).divide(value.x.subtract(this.x));
        const newX = s.multiply(s).subtract(this.x).subtract(value.x);
        const newY = s.multiply(this.x.subtract(newX)).subtract(this.y);
        return new AffinePoint(
            newX as Fq | Fq2,
            newY as Fq | Fq2,
            false,
            this.ec
        );
    }

    public subtract(value: AffinePoint): AffinePoint {
        return this.add(value.negate());
    }

    public multiply(value: Fq | bigint): AffinePoint {
        return scalarMultJacobian(value, this.toJacobian(), this.ec).toAffine();
    }

    public negate(): AffinePoint {
        return new AffinePoint(
            this.x,
            this.y.negate(),
            this.isInfinity,
            this.ec
        );
    }

    public equals(value: AffinePoint): boolean {
        return (
            this.x.equals(value.x) &&
            this.y.equals(value.y) &&
            this.isInfinity === value.isInfinity
        );
    }

    public clone(): AffinePoint {
        return new AffinePoint(
            this.x.clone(),
            this.y.clone(),
            this.isInfinity,
            this.ec
        );
    }

    public toString(): string {
        return `AffinePoint(x=${this.x}, y=${this.y}, i=${this.isInfinity})`;
    }
}
