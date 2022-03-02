import {
    AffinePoint,
    assert,
    bytesToInt,
    defaultEc,
    defaultEcTwist,
    EC,
    Fq,
    Fq2,
    fromHex,
    hash256,
    scalarMultJacobian,
    signFq,
    signFq2,
    toHex,
    yForX,
} from '../../internal';

export class JacobianPoint {
    public static fromBytes(
        bytes: Uint8Array,
        isExtension: boolean,
        ec: EC = defaultEc
    ): JacobianPoint {
        const provider = isExtension ? Fq2 : Fq;
        if (isExtension) {
            if (bytes.length !== 96) throw new Error('Expected 96 bytes.');
        } else {
            if (bytes.length !== 48) throw new Error('Expected 48 bytes.');
        }
        const mByte = bytes[0] & 0xe0;
        if ([0x20, 0x60, 0xe0].includes(mByte))
            throw new Error('Invalid first three bits.');
        const compressed = (mByte & 0x80) !== 0;
        const infinity = (mByte & 0x40) !== 0;
        const signed = (mByte & 0x20) !== 0;
        if (!compressed) throw new Error('Compression bit must be 1.');
        bytes[0] &= 0x1f;
        if (infinity) {
            for (const byte of bytes) {
                if (byte !== 0)
                    throw new Error(
                        'Point at infinity, but found non-zero byte.'
                    );
            }
            return new AffinePoint(
                provider.nil.zero(ec.q),
                provider.nil.zero(ec.q),
                true,
                ec
            ).toJacobian();
        }
        const x = (isExtension ? Fq2 : Fq).nil.fromBytes(ec.q, bytes);
        const yValue = yForX(x, ec);
        const sign = isExtension
            ? signFq2(yValue as Fq2, ec)
            : signFq(yValue as Fq, ec);
        const y = (sign === signed ? yValue : yValue.negate()) as Fq | Fq2;
        return new AffinePoint(x, y, false, ec).toJacobian();
    }

    public static fromHex(
        hex: string,
        isExtension: boolean,
        ec: EC = defaultEc
    ): JacobianPoint {
        return JacobianPoint.fromBytes(fromHex(hex), isExtension, ec);
    }

    public static generateG1(): JacobianPoint {
        return new AffinePoint(
            defaultEc.gx,
            defaultEc.gy,
            false,
            defaultEc
        ).toJacobian();
    }

    public static generateG2(): JacobianPoint {
        return new AffinePoint(
            defaultEcTwist.g2x,
            defaultEcTwist.g2y,
            false,
            defaultEcTwist
        ).toJacobian();
    }

    public static infinityG1(isExtension: boolean = false): JacobianPoint {
        const provider = isExtension ? Fq2 : Fq;
        return new JacobianPoint(
            provider.nil.zero(defaultEc.q),
            provider.nil.zero(defaultEc.q),
            provider.nil.zero(defaultEc.q),
            true,
            defaultEc
        );
    }

    public static infinityG2(isExtension: boolean = true): JacobianPoint {
        const provider = isExtension ? Fq2 : Fq;
        return new JacobianPoint(
            provider.nil.zero(defaultEcTwist.q),
            provider.nil.zero(defaultEcTwist.q),
            provider.nil.zero(defaultEcTwist.q),
            true,
            defaultEcTwist
        );
    }

    public static fromBytesG1(
        bytes: Uint8Array,
        isExtension: boolean = false
    ): JacobianPoint {
        return JacobianPoint.fromBytes(bytes, isExtension, defaultEc);
    }

    public static fromBytesG2(
        bytes: Uint8Array,
        isExtension: boolean = true
    ): JacobianPoint {
        return JacobianPoint.fromBytes(bytes, isExtension, defaultEcTwist);
    }

    public static fromHexG1(
        hex: string,
        isExtension: boolean = false
    ): JacobianPoint {
        return JacobianPoint.fromBytesG1(fromHex(hex), isExtension);
    }

    public static fromHexG2(
        hex: string,
        isExtension: boolean = true
    ): JacobianPoint {
        return JacobianPoint.fromBytesG2(fromHex(hex), isExtension);
    }

    constructor(
        public x: Fq | Fq2,
        public y: Fq | Fq2,
        public z: Fq | Fq2,
        public isInfinity: boolean,
        public ec: EC = defaultEc
    ) {
        assert(x instanceof y.constructor);
        assert(y instanceof z.constructor);
    }

    public isOnCurve(): boolean {
        return this.isInfinity || this.toAffine().isOnCurve();
    }

    public isValid(): boolean {
        return (
            this.isOnCurve() &&
            this.multiply(this.ec.n).equals(JacobianPoint.infinityG2())
        );
    }

    public getFingerprint(): number {
        const bytes = this.toBytes();
        return bytesToInt(hash256(bytes).slice(0, 4), 'big');
    }

    public toAffine(): AffinePoint {
        return this.isInfinity
            ? new AffinePoint(
                  Fq.nil.zero(this.ec.q),
                  Fq.nil.zero(this.ec.q),
                  true,
                  this.ec
              )
            : new AffinePoint(
                  this.x.divide(this.z.pow(2n)) as Fq | Fq2,
                  this.y.divide(this.z.pow(3n)) as Fq | Fq2,
                  false,
                  this.ec
              );
    }

    public toBytes(): Uint8Array {
        const point = this.toAffine();
        const output = point.x.toBytes();
        if (point.isInfinity) {
            const bytes = [0xc0];
            for (let i = 0; i < output.length - 1; i++) bytes.push(0);
            return Uint8Array.from(bytes);
        }
        const sign =
            point.y instanceof Fq2
                ? signFq2(point.y, this.ec)
                : signFq(point.y, this.ec);
        output[0] |= sign ? 0xa0 : 0x80;
        return output;
    }

    public toHex(): string {
        return toHex(this.toBytes());
    }

    public toString(): string {
        return `JacobianPoint(x=${this.x}, y=${this.y}, z=${this.z}, i=${this.isInfinity})`;
    }

    public double(): JacobianPoint {
        if (this.isInfinity || this.y.equals(this.x.zero(this.ec.q)))
            return new JacobianPoint(
                this.x.one(this.ec.q),
                this.x.one(this.ec.q),
                this.x.zero(this.ec.q),
                true,
                this.ec
            );
        const S = this.x
            .multiply(this.y)
            .multiply(this.y)
            .multiply(new Fq(this.ec.q, 4n));
        const Z_sq = this.z.multiply(this.z);
        const Z_4th = Z_sq.multiply(Z_sq);
        const Y_sq = this.y.multiply(this.y);
        const Y_4th = Y_sq.multiply(Y_sq);
        const M = this.x
            .multiply(this.x)
            .multiply(new Fq(this.ec.q, 3n))
            .add(this.ec.a.multiply(Z_4th));
        const X_p = M.multiply(M).subtract(S.multiply(new Fq(this.ec.q, 2n)));
        const Y_p = M.multiply(S.subtract(X_p)).subtract(
            Y_4th.multiply(new Fq(this.ec.q, 8n))
        );
        const Z_p = this.y.multiply(this.z).multiply(new Fq(this.ec.q, 2n));
        return new JacobianPoint(
            X_p as Fq | Fq2,
            Y_p as Fq | Fq2,
            Z_p as Fq | Fq2,
            false,
            this.ec
        );
    }

    public negate(): JacobianPoint {
        return this.toAffine().negate().toJacobian();
    }

    public add(value: JacobianPoint): JacobianPoint {
        if (this.isInfinity) return value;
        else if (value.isInfinity) return this;
        const U1 = this.x.multiply(value.z.pow(2n));
        const U2 = value.x.multiply(this.z.pow(2n));
        const S1 = this.y.multiply(value.z.pow(3n));
        const S2 = value.y.multiply(this.z.pow(3n));
        if (U1.equals(U2)) {
            if (!S1.equals(S2)) {
                return new JacobianPoint(
                    this.x.one(this.ec.q),
                    this.x.one(this.ec.q),
                    this.x.zero(this.ec.q),
                    true,
                    this.ec
                );
            } else return this.double();
        }
        const H = U2.subtract(U1);
        const R = S2.subtract(S1);
        const H_sq = H.multiply(H);
        const H_cu = H.multiply(H_sq);
        const X3 = R.multiply(R)
            .subtract(H_cu)
            .subtract(U1.multiply(H_sq).multiply(new Fq(this.ec.q, 2n)));
        const Y3 = R.multiply(U1.multiply(H_sq).subtract(X3)).subtract(
            S1.multiply(H_cu)
        );
        const Z3 = H.multiply(this.z).multiply(value.z);
        return new JacobianPoint(
            X3 as Fq | Fq2,
            Y3 as Fq | Fq2,
            Z3 as Fq | Fq2,
            false,
            this.ec
        );
    }

    public multiply(value: Fq | bigint): JacobianPoint {
        return scalarMultJacobian(value, this, this.ec);
    }

    public equals(value: JacobianPoint): boolean {
        return this.toAffine().equals(value.toAffine());
    }

    public clone(): JacobianPoint {
        return new JacobianPoint(
            this.x.clone(),
            this.y.clone(),
            this.z.clone(),
            this.isInfinity,
            this.ec
        );
    }
}
