import {
    AnyField,
    bigIntToBytes,
    bytesToBigInt,
    Field,
    fromHex,
    mod,
    modPow,
    OperatorError,
    toHex,
} from '../../internal';

export class Fq extends Field<Fq> {
    public static nil = new Fq(1n, 0n);

    public extension = 1;
    public value: bigint;

    constructor(public Q: bigint, value: bigint) {
        super();
        this.value = mod(value, Q);
    }

    public fromBytes(Q: bigint, bytes: Uint8Array): this {
        if (bytes.length !== 48) throw new RangeError('Expected 48 bytes.');
        return new Fq(Q, bytesToBigInt(bytes, 'big')) as this;
    }

    public fromHex(Q: bigint, hex: string): this {
        return Fq.nil.fromBytes(Q, fromHex(hex)) as this;
    }

    public fromFq(_Q: bigint, fq: this): this {
        return fq;
    }

    public zero(Q: bigint): this {
        return new Fq(Q, 0n) as this;
    }

    public one(Q: bigint): this {
        return new Fq(Q, 1n) as this;
    }

    public clone(): this {
        return new Fq(this.Q, this.value) as this;
    }

    public toBytes(): Uint8Array {
        return bigIntToBytes(this.value, 48, 'big');
    }

    public toBool(): boolean {
        return true;
    }

    public toHex(): string {
        return toHex(this.toBytes());
    }

    public toString(): string {
        const hex = this.value.toString(16);
        return `Fq(0x${
            hex.length > 10
                ? `${hex.slice(0, 5)}..${hex.slice(hex.length - 5)}`
                : hex
        })`;
    }

    public negate(): this {
        return new Fq(this.Q, -this.value) as this;
    }

    public inverse(): this {
        let x0 = 1n,
            x1 = 0n,
            y0 = 0n,
            y1 = 1n;
        let a = this.Q;
        let b = this.value;
        while (a != 0n) {
            const q = b / a;
            const tempB = b;
            b = a;
            a = mod(tempB, a);
            const temp_x0 = x0;
            x0 = x1;
            x1 = temp_x0 - q * x1;
            const temp_y0 = y0;
            y0 = y1;
            y1 = temp_y0 - q * y1;
        }
        return new Fq(this.Q, x0) as this;
    }

    public qiPower(_i: number): this {
        return this;
    }

    public pow(exponent: bigint): this {
        return (
            exponent === 0n
                ? new Fq(this.Q, 1n)
                : exponent === 1n
                ? new Fq(this.Q, this.value)
                : mod(exponent, 2n) === 0n
                ? new Fq(this.Q, this.value * this.value).pow(exponent / 2n)
                : new Fq(this.Q, this.value * this.value)
                      .pow(exponent / 2n)
                      .multiply(this)
        ) as this;
    }

    public addTo(value: AnyField | bigint): this {
        if (typeof value === 'bigint')
            return new Fq(this.Q, this.value + value) as this;
        else if (value instanceof Fq)
            return new Fq(this.Q, this.value + value.value) as this;
        else throw new OperatorError('Can only add with Fq or bigint values.');
    }

    public multiplyWith(value: AnyField | bigint): this {
        if (typeof value === 'bigint')
            return new Fq(this.Q, this.value * value) as this;
        else if (value instanceof Fq)
            return new Fq(this.Q, this.value * value.value) as this;
        else
            throw new OperatorError(
                'Can only multiply with Fq or bigint values.'
            );
    }

    public subtract(value: AnyField | bigint): this {
        return this.add(
            typeof value === 'bigint' ? -value : value.negate()
        ) as this;
    }

    public divide(value: AnyField | bigint): this {
        return this.multiply(
            (typeof value === 'bigint'
                ? new Fq(this.Q, value)
                : value
            ).inverse()
        ) as this;
    }

    public equalTo(value: AnyField | bigint): boolean {
        return (
            value instanceof Fq &&
            this.value === value.value &&
            this.Q === value.Q
        );
    }

    public lt(value: Fq): boolean {
        return this.value < value.value;
    }

    public gt(value: Fq): boolean {
        return this.value > value.value;
    }

    public lteq(value: Fq): boolean {
        return this.lt(value) || this.equals(value);
    }

    public gteq(value: Fq): boolean {
        return this.gt(value) || this.equals(value);
    }

    public modSqrt(): Fq {
        if (this.value === 0n) {
            return new Fq(this.Q, 0n);
        } else if (modPow(this.value, (this.Q - 1n) / 2n, this.Q) != 1n) {
            throw new Error('No sqrt exists.');
        } else if (mod(this.Q, 4n) === 3n) {
            return new Fq(
                this.Q,
                modPow(this.value, (this.Q + 1n) / 4n, this.Q)
            );
        } else if (mod(this.Q, 8n) === 5n) {
            return new Fq(
                this.Q,
                modPow(this.value, (this.Q + 3n) / 8n, this.Q)
            );
        }
        let S = 0n;
        let q = this.Q - 1n;
        while (mod(q, 2n) === 0n) {
            q /= 2n;
            S++;
        }
        let z = 0n;
        for (let i = 0n; i < this.Q; i += 1n) {
            const euler = modPow(i, (this.Q - 1n) / 2n, this.Q);
            if (euler === mod(-1n, this.Q)) {
                z = i;
                break;
            }
        }
        let M = S;
        let c = modPow(z, q, this.Q);
        let t = modPow(this.value, q, this.Q);
        let R = modPow(this.value, (q + 1n) / 2n, this.Q);
        while (true) {
            if (t === 0n) return new Fq(this.Q, 0n);
            else if (t === 1n) return new Fq(this.Q, R);
            let i = 0n;
            let f = t;
            while (f != 1n) {
                f = mod(f ** 2n, this.Q);
                i++;
            }
            const b = modPow(c, modPow(2n, M - i - 1n, this.Q), this.Q);
            M = i;
            c = mod(b ** 2n, this.Q);
            t = mod(t * c, this.Q);
            R = mod(R * b, this.Q);
        }
    }

    public add(value: AnyField | bigint): AnyField {
        try {
            return this.addTo(value);
        } catch (error) {
            if (!(error instanceof OperatorError) || typeof value === 'bigint')
                throw error;
            return value.addTo(this);
        }
    }

    public multiply(value: AnyField | bigint): AnyField {
        try {
            return this.multiplyWith(value);
        } catch (error) {
            if (!(error instanceof OperatorError) || typeof value === 'bigint')
                throw error;
            return value.multiplyWith(this);
        }
    }

    public equals(value: AnyField | bigint): boolean {
        try {
            return this.equalTo(value);
        } catch (error) {
            if (!(error instanceof OperatorError)) throw error;
            return typeof value === 'bigint' ? false : value.equalTo(this);
        }
    }
}
