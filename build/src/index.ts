import { assert, AssertionError } from "chai"
import { createHash, createHmac } from "crypto"



export type AnyField = Field<AnyField>;

export abstract class Field<T extends Field<T>> {
    public abstract Q: bigint;
    public abstract extension: number;

    public abstract zero(Q: bigint): this;
    public abstract one(Q: bigint): this;
    public abstract fromBytes(Q: bigint, bytes: Buffer): this;
    public abstract fromHex(Q: bigint, hex: string): this;
    public abstract fromFq(Q: bigint, fq: Fq): this;

    public abstract clone(): this;
    public abstract toBytes(): Buffer;
    public abstract toBool(): boolean;
    public abstract toHex(): string;
    public abstract toString(): string;

    public abstract negate(): this;
    public abstract inverse(): this;
    public abstract qiPower(i: number): this;
    public abstract pow(exponent: bigint): this;

    public abstract addTo(value: AnyField | bigint): this;
    public abstract multiplyWith(value: AnyField | bigint): this;

    public abstract add(value: AnyField | bigint): AnyField;
    public abstract subtract(value: AnyField | bigint): AnyField;
    public abstract multiply(value: AnyField | bigint): AnyField;
    public abstract divide(value: AnyField | bigint): AnyField;

    public abstract equalTo(value: AnyField | bigint): boolean;
    public abstract equals(value: AnyField | bigint): boolean;
    public abstract lt(value: this): boolean;
    public abstract gt(value: this): boolean;
    public abstract lteq(value: this): boolean;
    public abstract gteq(value: this): boolean;
}


undefined


export abstract class FieldExt<T extends Field<T>> extends Field<FieldExt<T>> {
    public abstract root: T;

    public elements: T[];
    public basefield: T;

    constructor(public Q: bigint, elements: T[]) {
        super();
        this.elements = elements;
        this.basefield = elements[0];
    }

    public abstract construct(Q: bigint, elements: T[]): this;

    public constructWithRoot(Q: bigint, elements: T[]): this {
        return this.construct(Q, elements).withRoot(this.root);
    }

    public withRoot(root: T): this {
        this.root = root;
        return this;
    }

    public fromBytes(Q: bigint, bytes: Buffer): this {
        const length = this.extension * 48;
        if (bytes.length !== length) {
            throw new RangeError(`Expected ${length} bytes.`);
        }
        const embeddedSize = 48 * (this.extension / this.elements.length);
        const elements: Array<Buffer> = [];
        for (let i = 0; i < this.elements.length; i++) {
            elements.push(
                bytes.slice(i * embeddedSize, (i + 1) * embeddedSize)
            );
        }
        return new (this.constructor as any)(
            Q,
            ...elements
                .reverse()
                .map((bytes) => this.basefield.fromBytes(Q, bytes))
        );
    }

    public fromHex(Q: bigint, hex: string): this {
        return this.fromBytes(Q, Buffer.from(hex, 'hex'));
    }

    public fromFq(Q: bigint, fq: Fq): this {
        const y = this.basefield.fromFq(Q, fq);
        const z = this.basefield.zero(Q);
        const elements: Array<T> = [];
        for (let i = 0; i < this.elements.length; i++)
            elements.push(i === 0 ? y : z);
        const result = this.construct(Q, elements);
        if (this instanceof Fq2) result.root = new Fq(Q, -1n) as any;
        else if (this instanceof Fq6)
            result.root = new Fq2(Q, Fq.nil.one(Q), Fq.nil.one(Q)) as any;
        else if (this instanceof Fq12)
            result.root = new Fq6(
                Q,
                Fq2.nil.zero(Q),
                Fq2.nil.one(Q),
                Fq2.nil.zero(Q)
            ) as any;
        return result;
    }

    public zero(Q: bigint): this {
        return this.fromFq(Q, new Fq(Q, 0n));
    }

    public one(Q: bigint): this {
        return this.fromFq(Q, new Fq(Q, 1n));
    }

    public clone(): this {
        return this.constructWithRoot(
            this.Q,
            this.elements.map((element) => element.clone())
        );
    }

    public toBytes(): Buffer {
        const bytes: Array<number> = [];
        for (let i = this.elements.length - 1; i >= 0; i--) {
            bytes.push(...this.elements[i].toBytes());
        }
        return Buffer.from(bytes);
    }

    public toBool(): boolean {
        return this.elements.findIndex((element) => !element.toBool()) === -1;
    }

    public toHex(): string {
        return this.toBytes().toString('hex');
    }

    public toString(): string {
        return `Fq${this.extension}(${this.elements.join(', ')})`;
    }

    public negate(): this {
        return this.constructWithRoot(
            this.Q,
            this.elements.map((element) => element.negate())
        );
    }

    public qiPower(i: number): this {
        if (this.Q != q) throw new OperatorError('Invalid Q in qiPower.');
        i = modNumber(i, this.extension);
        if (i === 0) return this;
        return this.constructWithRoot(
            this.Q,
            this.elements.map((element, index) =>
                index === 0
                    ? element.qiPower(i)
                    : element
                          .qiPower(i)
                          .multiply(getFrobCoeff(this.extension, i, index)!)
            ) as T[]
        );
    }

    public pow(exponent: bigint): this {
        assert(exponent >= 0n);
        let result = this.one(this.Q).withRoot(this.root);
        let base: FieldExt<T> = this;
        while (exponent != 0n) {
            if (exponent & 1n) result = result.multiply(base) as this;
            base = base.multiply(base) as this;
            exponent >>= 1n;
        }
        return result;
    }

    public addTo(value: AnyField | bigint): this {
        let elements: AnyField[];
        if (value instanceof FieldExt && value instanceof this.constructor) {
            elements = value.elements;
        } else {
            if (typeof value !== 'bigint' && value.extension > this.extension)
                throw new OperatorError(
                    'Operand must be higher than extension.'
                );
            elements = this.elements.map(() => this.basefield.zero(this.Q));
            elements[0] = elements[0].add(value);
        }
        return this.constructWithRoot(
            this.Q,
            this.elements.map((element, i) => element.add(elements[i])) as T[]
        );
    }

    public multiplyWith(value: AnyField | bigint): this {
        if (typeof value === 'bigint') {
            return this.constructWithRoot(
                this.Q,
                this.elements.map((element) => element.multiply(value)) as T[]
            );
        } else if (this.extension < value.extension)
            throw new OperatorError('Extension must be lower than operand.');
        const elements = this.elements.map(() => this.basefield.zero(this.Q));
        for (const [i, x] of this.elements.entries()) {
            if (
                value instanceof FieldExt &&
                value.extension === this.extension
            ) {
                for (const [j, y] of value.elements.entries()) {
                    if (x.toBool() && y.toBool()) {
                        const index = modNumber(i + j, this.elements.length);
                        if (i + j >= this.elements.length) {
                            elements[index] = elements[index].add(
                                x.multiply(y).multiply(this.root)
                            ) as T;
                        } else {
                            elements[index] = elements[index].add(
                                x.multiply(y)
                            ) as T;
                        }
                    }
                }
            } else if (x.toBool()) elements[i] = x.multiply(value) as T;
        }
        return this.constructWithRoot(this.Q, elements);
    }

    public subtract(value: AnyField | bigint): FieldExt<AnyField> {
        return this.add(typeof value === 'bigint' ? -value : value.negate());
    }

    public divide(value: AnyField | bigint): FieldExt<AnyField> {
        return this.multiply(
            typeof value === 'bigint' ? ~value : value.inverse()
        );
    }

    public equalTo(value: AnyField | bigint): boolean {
        if (!(value instanceof FieldExt && value instanceof this.constructor)) {
            if (
                typeof value === 'bigint' ||
                (value instanceof FieldExt && this.extension > value.extension)
            ) {
                for (let i = 1; i < this.elements.length; i++) {
                    if (!this.elements[i].equals(this.root.zero(this.Q)))
                        return false;
                }
                return this.elements[0].equals(value);
            }
            throw new OperatorError('Invalid operand.');
        } else
            return (
                this.elements.findIndex(
                    (element, i) => !element.equals(value.elements[i])
                ) === -1 && this.Q === value.Q
            );
    }

    public lt(value: this): boolean {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const a = this.elements[i];
            const b = value.elements[i];
            if (a.lt(b)) return true;
            else if (a.gt(b)) return false;
        }
        return false;
    }

    public gt(value: this): boolean {
        for (let i = this.elements.length - 1; i >= 0; i--) {
            const a = this.elements[i];
            const b = value.elements[i];
            if (a.gt(b)) return true;
            else if (a.lt(b)) return false;
        }
        return false;
    }

    public lteq(value: this): boolean {
        return this.lt(value) || this.equals(value);
    }

    public gteq(value: this): boolean {
        return this.gt(value) || this.equals(value);
    }

    public add(value: AnyField | bigint): FieldExt<AnyField> {
        try {
            return this.addTo(value);
        } catch (error) {
            if (!(error instanceof OperatorError) || typeof value === 'bigint')
                throw error;
            return value.addTo(this) as FieldExt<AnyField>;
        }
    }

    public multiply(value: AnyField | bigint): FieldExt<AnyField> {
        try {
            return this.multiplyWith(value);
        } catch (error) {
            if (!(error instanceof OperatorError) || typeof value === 'bigint')
                throw error;
            return value.multiplyWith(this) as FieldExt<AnyField>;
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




export class Fq extends Field<Fq> {
    public static nil = new Fq(1n, 0n);

    public extension = 1;
    public value: bigint;

    constructor(public Q: bigint, value: bigint) {
        super();
        this.value = mod(value, Q);
    }

    public fromBytes(Q: bigint, bytes: Buffer): this {
        if (bytes.length !== 48) throw new RangeError('Expected 48 bytes.');
        return new Fq(Q, bytesToBigInt(bytes, 'big')) as this;
    }

    public fromHex(Q: bigint, hex: string): this {
        return Fq.nil.fromBytes(Q, Buffer.from(hex, 'hex')) as this;
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

    public toBytes(): Buffer {
        return bigIntToBytes(this.value, 48, 'big');
    }

    public toBool(): boolean {
        return true;
    }

    public toHex(): string {
        return this.toBytes().toString('hex');
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




export const x = -0xd201000000010000n;
export const q =
    0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
export const a = new Fq(q, 0n);
export const b = new Fq(q, 4n);
export const aTwist = new Fq2(q, new Fq(q, 0n), new Fq(q, 0n));
export const bTwist = new Fq2(q, new Fq(q, 4n), new Fq(q, 4n));

export const gx = new Fq(
    q,
    0x17f1d3a73197d7942695638c4fa9ac0fc3688c4f9774b905a14e3a3f171bac586c55e83ff97a1aeffb3af00adb22c6bbn
);

export const gy = new Fq(
    q,
    0x08b3f481e3aaa0f1a09e30ed741d8ae4fcf5e095d5d00af600db18cb2c04b3edd03cc744a2888ae40caa232946c5e7e1n
);

export const g2x = new Fq2(
    q,
    new Fq(
        q,
        352701069587466618187139116011060144890029952792775240219908644239793785735715026873347600343865175952761926303160n
    ),
    new Fq(
        q,
        3059144344244213709971259814753781636986470325476647558659373206291635324768958432433509563104347017837885763365758n
    )
);

export const g2y = new Fq2(
    q,
    new Fq(
        q,
        1985150602287291935568054521177171638300868978215655730859378665066344726373823718423869104263333984641494340347905n
    ),
    new Fq(
        q,
        927553665492332455747201965776037880757740193453592970025027978793976877002675564980949289727957565575433344219582n
    )
);

export const n =
    0x73eda753299d7d483339d80809a1d80553bda402fffe5bfeffffffff00000001n;
export const h = 0x396c8c005555e1568c00aaab0000aaabn;
export const hEff =
    0xbc69f08f2ee75b3584c6a0ea91b352888e2a8e9145ad7689986ff031508ffe1329c2f178731db956d82bf015d1212b02ec0ec69d7477c1ae954cbc06689f6a359894c0adebbf6b4e8020005aaa95551n;
export const k = 12n;
export const sqrtN3 =
    1586958781458431025242759403266842894121773480562120986020912974854563298150952611241517463240701n;
export const sqrtN3m1o2 =
    793479390729215512621379701633421447060886740281060493010456487427281649075476305620758731620350n;

export const defaultEc: EC = {
    q,
    a,
    b,
    gx,
    gy,
    g2x,
    g2y,
    n,
    h,
    x,
    k,
    sqrtN3,
    sqrtN3m1o2,
};

export const defaultEcTwist: EC = {
    q,
    a: aTwist,
    b: bTwist,
    gx,
    gy,
    g2x,
    g2y,
    n,
    h: hEff,
    x,
    k,
    sqrtN3,
    sqrtN3m1o2,
};




export const frobCoeffs: Record<`${number},${number},${number}`, AnyField> = {
    '2,1,1': new Fq(q, -1n),
    '6,1,1': new Fq2(
        q,
        new Fq(q, 0n),
        new Fq(
            q,
            0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaacn
        )
    ),
    '6,1,2': new Fq2(
        q,
        new Fq(
            q,
            0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaadn
        ),
        new Fq(q, 0n)
    ),
    '6,2,1': new Fq2(
        q,
        new Fq(
            q,
            0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffen
        ),
        new Fq(q, 0n)
    ),
    '6,2,2': new Fq2(
        q,
        new Fq(
            q,
            0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaacn
        ),
        new Fq(q, 0n)
    ),
    '6,3,1': new Fq2(q, new Fq(q, 0n), new Fq(q, 1n)),
    '6,3,2': new Fq2(
        q,
        new Fq(
            q,
            0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaan
        ),
        new Fq(q, 0n)
    ),
    '6,4,1': new Fq2(
        q,
        new Fq(
            q,
            0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaacn
        ),
        new Fq(q, 0n)
    ),
    '6,4,2': new Fq2(
        q,
        new Fq(
            q,
            0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffen
        ),
        new Fq(q, 0n)
    ),
    '6,5,1': new Fq2(
        q,
        new Fq(q, 0n),
        new Fq(
            q,
            0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffen
        )
    ),
    '6,5,2': new Fq2(
        q,
        new Fq(
            q,
            0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffeffffn
        ),
        new Fq(q, 0n)
    ),
    '12,1,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x1904d3bf02bb0667c231beb4202c0d1f0fd603fd3cbd5f4f7b2443d784bab9c4f67ea53d63e7813d8d0775ed92235fb8n
            ),
            new Fq(
                q,
                0xfc3e2b36c4e03288e9e902231f9fb854a14787b6c7b36fec0c8ec971f63c5f282d5ac14d6c7ec22cf78a126ddc4af3n
            )
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,2,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffeffffn
            ),
            new Fq(q, 0n)
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,3,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x135203e60180a68ee2e9c448d77a2cd91c3dedd930b1cf60ef396489f61eb45e304466cf3e67fa0af1ee7b04121bdea2n
            ),
            new Fq(
                q,
                0x6af0e0437ff400b6831e36d6bd17ffe48395dabc2d3435e77f76e17009241c5ee67992f72ec05f4c81084fbede3cc09n
            )
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,4,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x5f19672fdf76ce51ba69c6076a0f77eaddb3a93be6f89688de17d813620a00022e01fffffffefffen
            ),
            new Fq(q, 0n)
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,5,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x144e4211384586c16bd3ad4afa99cc9170df3560e77982d0db45f3536814f0bd5871c1908bd478cd1ee605167ff82995n
            ),
            new Fq(
                q,
                0x5b2cfd9013a5fd8df47fa6b48b1e045f39816240c0b8fee8beadf4d8e9c0566c63a3e6e257f87329b18fae980078116n
            )
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,6,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaan
            ),
            new Fq(q, 0n)
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,7,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0xfc3e2b36c4e03288e9e902231f9fb854a14787b6c7b36fec0c8ec971f63c5f282d5ac14d6c7ec22cf78a126ddc4af3n
            ),
            new Fq(
                q,
                0x1904d3bf02bb0667c231beb4202c0d1f0fd603fd3cbd5f4f7b2443d784bab9c4f67ea53d63e7813d8d0775ed92235fb8n
            )
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,8,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaacn
            ),
            new Fq(q, 0n)
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,9,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x6af0e0437ff400b6831e36d6bd17ffe48395dabc2d3435e77f76e17009241c5ee67992f72ec05f4c81084fbede3cc09n
            ),
            new Fq(
                q,
                0x135203e60180a68ee2e9c448d77a2cd91c3dedd930b1cf60ef396489f61eb45e304466cf3e67fa0af1ee7b04121bdea2n
            )
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,10,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x1a0111ea397fe699ec02408663d4de85aa0d857d89759ad4897d29650fb85f9b409427eb4f49fffd8bfd00000000aaadn
            ),
            new Fq(q, 0n)
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
    '12,11,1': new Fq6(
        q,
        new Fq2(
            q,
            new Fq(
                q,
                0x5b2cfd9013a5fd8df47fa6b48b1e045f39816240c0b8fee8beadf4d8e9c0566c63a3e6e257f87329b18fae980078116n
            ),
            new Fq(
                q,
                0x144e4211384586c16bd3ad4afa99cc9170df3560e77982d0db45f3536814f0bd5871c1908bd478cd1ee605167ff82995n
            )
        ),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n)),
        new Fq2(q, new Fq(q, 0n), new Fq(q, 0n))
    ),
};

export function getFrobCoeff(
    extension: number,
    i: number,
    index: number
): AnyField | undefined {
    return frobCoeffs[`${extension},${i},${index}`];
}


undefined


export const sha256: HashInfo = {
    byteSize: 32,
    blockSize: 64,
    convert: (buffer) => createHash('sha256').update(buffer).digest(),
};

export const sha512: HashInfo = {
    byteSize: 64,
    blockSize: 128,
    convert: (buffer) => createHash('sha512').update(buffer).digest(),
};




export const xnum = [
    new Fq2(
        q,
        new Fq(
            q,
            0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97d6n
        ),
        new Fq(
            q,
            0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97d6n
        )
    ),
    new Fq2(
        q,
        new Fq(q, 0n),
        new Fq(
            q,
            0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71an
        )
    ),
    new Fq2(
        q,
        new Fq(
            q,
            0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71en
        ),
        new Fq(
            q,
            0x8ab05f8bdd54cde190937e76bc3e447cc27c3d6fbd7063fcd104635a790520c0a395554e5c6aaaa9354ffffffffe38dn
        )
    ),
    new Fq2(
        q,
        new Fq(
            q,
            0x171d6541fa38ccfaed6dea691f5fb614cb14b4e7f4e810aa22d6108f142b85757098e38d0f671c7188e2aaaaaaaa5ed1n
        ),
        new Fq(q, 0n)
    ),
];

export const xden = [
    new Fq2(
        q,
        new Fq(q, 0n),
        new Fq(
            q,
            0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa63n
        )
    ),
    new Fq2(
        q,
        new Fq(q, 0xcn),
        new Fq(
            q,
            0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa9fn
        )
    ),
    new Fq2(q, new Fq(q, 1n), new Fq(q, 0n)),
];

export const ynum = [
    new Fq2(
        q,
        new Fq(
            q,
            0x1530477c7ab4113b59a4c18b076d11930f7da5d4a07f649bf54439d87d27e500fc8c25ebf8c92f6812cfc71c71c6d706n
        ),
        new Fq(
            q,
            0x1530477c7ab4113b59a4c18b076d11930f7da5d4a07f649bf54439d87d27e500fc8c25ebf8c92f6812cfc71c71c6d706n
        )
    ),
    new Fq2(
        q,
        new Fq(q, 0n),
        new Fq(
            q,
            0x5c759507e8e333ebb5b7a9a47d7ed8532c52d39fd3a042a88b58423c50ae15d5c2638e343d9c71c6238aaaaaaaa97ben
        )
    ),
    new Fq2(
        q,
        new Fq(
            q,
            0x11560bf17baa99bc32126fced787c88f984f87adf7ae0c7f9a208c6b4f20a4181472aaa9cb8d555526a9ffffffffc71cn
        ),
        new Fq(
            q,
            0x8ab05f8bdd54cde190937e76bc3e447cc27c3d6fbd7063fcd104635a790520c0a395554e5c6aaaa9354ffffffffe38fn
        )
    ),
    new Fq2(
        q,
        new Fq(
            q,
            0x124c9ad43b6cf79bfbf7043de3811ad0761b0f37a1e26286b0e977c69aa274524e79097a56dc4bd9e1b371c71c718b10n
        ),
        new Fq(q, 0n)
    ),
];

export const yden = [
    new Fq2(
        q,
        new Fq(
            q,
            0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa8fbn
        ),
        new Fq(
            q,
            0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa8fbn
        )
    ),
    new Fq2(
        q,
        new Fq(q, 0n),
        new Fq(
            q,
            0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffa9d3n
        )
    ),
    new Fq2(
        q,
        new Fq(q, 0x12n),
        new Fq(
            q,
            0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa99n
        )
    ),
    new Fq2(q, new Fq(q, 1n), new Fq(q, 0n)),
];




export const xi_2 = new Fq2(q, new Fq(q, -2n), new Fq(q, -1n));
export const Ell2p_a = new Fq2(q, new Fq(q, 0n), new Fq(q, 240n));
export const Ell2p_b = new Fq2(q, new Fq(q, 1012n), new Fq(q, 1012n));
export const ev1 =
    0x699be3b8c6870965e5bf892ad5d2cc7b0e85a117402dfd83b7f4a947e02d978498255a2aaec0ac627b5afbdf1bf1c90n;
export const ev2 =
    0x8157cd83046453f5dd0972b6e3949e4288020b5b8a9cc99ca07e27089a2ce2436d965026adad3ef7baba37f2183e9b5n;
export const ev3 =
    0xab1c2ffdd6c253ca155231eb3e71ba044fd562f6f72bc5bad5ec46a0b7a3b0247cf08ce6c6317f40edbc653a72dee17n;
export const ev4 =
    0xaa404866706722864480885d68ad0ccac1967c7544b447873cc37e0181271e006df72162a3d3e0287bf597fbf7f8fc1n;
export const etas = [
    new Fq2(q, new Fq(q, ev1), new Fq(q, ev2)),
    new Fq2(q, new Fq(q, q - ev2), new Fq(q, ev1)),
    new Fq2(q, new Fq(q, ev3), new Fq(q, ev4)),
    new Fq2(q, new Fq(q, q - ev4), new Fq(q, ev3)),
];




export const rv1 =
    0x6af0e0437ff400b6831e36d6bd17ffe48395dabc2d3435e77f76e17009241c5ee67992f72ec05f4c81084fbede3cc09n;

export const rootsOfUnity = [
    new Fq2(q, new Fq(q, 1n), new Fq(q, 0n)),
    new Fq2(q, new Fq(q, 0n), new Fq(q, 1n)),
    new Fq2(q, new Fq(q, rv1), new Fq(q, rv1)),
    new Fq2(q, new Fq(q, rv1), new Fq(q, q - rv1)),
];


export const basicSchemeDst = Buffer.from(
    'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_',
    'utf-8'
);
export const augSchemeDst = Buffer.from(
    'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_AUG_',
    'utf-8'
);
export const popSchemeDst = Buffer.from(
    'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_',
    'utf-8'
);
export const popSchemePopDst = Buffer.from(
    'BLS_POP_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_',
    'utf-8'
);


undefined


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




export interface EC {
    q: bigint;
    a: AnyField;
    b: AnyField;
    gx: Fq;
    gy: Fq;
    g2x: Fq2;
    g2y: Fq2;
    n: bigint;
    h: bigint;
    x: bigint;
    k: bigint;
    sqrtN3: bigint;
    sqrtN3m1o2: bigint;
}


undefined


export class JacobianPoint {
    public static fromBytes(
        bytes: Buffer,
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
        return JacobianPoint.fromBytes(
            Buffer.from(hex, 'hex'),
            isExtension,
            ec
        );
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
        bytes: Buffer,
        isExtension: boolean = false
    ): JacobianPoint {
        return JacobianPoint.fromBytes(bytes, isExtension, defaultEc);
    }

    public static fromBytesG2(
        bytes: Buffer,
        isExtension: boolean = true
    ): JacobianPoint {
        return JacobianPoint.fromBytes(bytes, isExtension, defaultEcTwist);
    }

    public static fromHexG1(
        hex: string,
        isExtension: boolean = false
    ): JacobianPoint {
        return JacobianPoint.fromBytesG1(Buffer.from(hex, 'hex'), isExtension);
    }

    public static fromHexG2(
        hex: string,
        isExtension: boolean = true
    ): JacobianPoint {
        return JacobianPoint.fromBytesG2(Buffer.from(hex, 'hex'), isExtension);
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

    public toBytes(): Buffer {
        const point = this.toAffine();
        const output = point.x.toBytes();
        if (point.isInfinity) {
            const bytes = [0xc0];
            for (let i = 0; i < output.length - 1; i++) bytes.push(0);
            return Buffer.from(bytes);
        }
        const sign =
            point.y instanceof Fq2
                ? signFq2(point.y, this.ec)
                : signFq(point.y, this.ec);
        output[0] |= sign ? 0xa0 : 0x80;
        return output;
    }

    public toHex(): string {
        return this.toBytes().toString('hex');
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


export class OperatorError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, OperatorError.prototype);
    }
}


export interface HashInfo {
    convert: (bytes: Buffer) => Buffer;
    byteSize: number;
    blockSize: number;
}


undefined


export class PrivateKey {
    public static size = 32;

    public static fromBytes(bytes: Buffer): PrivateKey {
        return new PrivateKey(mod(bytesToBigInt(bytes, 'big'), defaultEc.n));
    }

    public static fromHex(hex: string): PrivateKey {
        return PrivateKey.fromBytes(Buffer.from(hex, 'hex'));
    }

    public static fromSeed(seed: Buffer): PrivateKey {
        const length = 48;
        const okm = extractExpand(
            length,
            Buffer.from([...seed, 0]),
            Buffer.from('BLS-SIG-KEYGEN-SALT-', 'utf-8'),
            Buffer.from([0, length])
        );
        return new PrivateKey(mod(bytesToBigInt(okm, 'big'), defaultEc.n));
    }

    public static fromBigInt(value: bigint): PrivateKey {
        return new PrivateKey(mod(value, defaultEc.n));
    }

    public static aggregate(privateKeys: PrivateKey[]): PrivateKey {
        return new PrivateKey(
            mod(
                privateKeys.reduce(
                    (aggregate, privateKey) => aggregate + privateKey.value,
                    0n
                ),
                defaultEc.n
            )
        );
    }

    constructor(public value: bigint) {
        assert(value < defaultEc.n);
    }

    public getG1(): JacobianPoint {
        return JacobianPoint.generateG1().multiply(this.value);
    }

    public toBytes(): Buffer {
        return bigIntToBytes(this.value, PrivateKey.size, 'big');
    }

    public toHex(): string {
        return this.toBytes().toString('hex');
    }

    public toString(): string {
        return `PrivateKey(0x${this.toHex()})`;
    }

    public equals(value: PrivateKey): boolean {
        return this.value === value.value;
    }
}




export class AugSchemeMPL {
    public static keyGen(seed: Buffer): PrivateKey {
        return keyGen(seed);
    }

    public static sign(privateKey: PrivateKey, message: Buffer): JacobianPoint {
        const publicKey = privateKey.getG1();
        return coreSignMpl(
            privateKey,
            Buffer.from([...publicKey.toBytes(), ...message]),
            augSchemeDst
        );
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(
            publicKey,
            Buffer.from([...publicKey.toBytes(), ...message]),
            signature,
            augSchemeDst
        );
    }

    public static aggregate(signatures: JacobianPoint[]): JacobianPoint {
        return coreAggregateMpl(signatures);
    }

    public static aggregateVerify(
        publicKeys: JacobianPoint[],
        messages: Buffer[],
        signature: JacobianPoint
    ): boolean {
        if (publicKeys.length !== messages.length || !publicKeys.length)
            return false;
        const mPrimes: Array<Buffer> = [];
        for (let i = 0; i < publicKeys.length; i++)
            mPrimes.push(
                Buffer.from([...publicKeys[i].toBytes(), ...messages[i]])
            );
        return coreAggregateVerify(
            publicKeys,
            mPrimes,
            signature,
            augSchemeDst
        );
    }

    public static deriveChildSk(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSk(privateKey, index);
    }

    public static deriveChildSkUnhardened(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSkUnhardened(privateKey, index);
    }

    public static deriveChildPkUnhardened(
        publicKey: JacobianPoint,
        index: number
    ): JacobianPoint {
        return deriveChildG1Unhardened(publicKey, index);
    }
}




export class BasicSchemeMPL {
    public static keyGen(seed: Buffer): PrivateKey {
        return keyGen(seed);
    }

    public static sign(privateKey: PrivateKey, message: Buffer): JacobianPoint {
        return coreSignMpl(privateKey, message, basicSchemeDst);
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(publicKey, message, signature, basicSchemeDst);
    }

    public static aggregate(signatures: JacobianPoint[]): JacobianPoint {
        return coreAggregateMpl(signatures);
    }

    public static aggregateVerify(
        publicKeys: JacobianPoint[],
        messages: Buffer[],
        signature: JacobianPoint
    ): boolean {
        if (publicKeys.length !== messages.length || !publicKeys.length)
            return false;
        for (const message of messages) {
            for (const match of messages) {
                if (message !== match && message.equals(match)) return false;
            }
        }
        return coreAggregateVerify(
            publicKeys,
            messages,
            signature,
            basicSchemeDst
        );
    }

    public static deriveChildSk(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSk(privateKey, index);
    }

    public static deriveChildSkUnhardened(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSkUnhardened(privateKey, index);
    }

    public static deriveChildPkUnhardened(
        publicKey: JacobianPoint,
        index: number
    ): JacobianPoint {
        return deriveChildG1Unhardened(publicKey, index);
    }
}


undefined


export class PopSchemeMPL {
    public static keyGen(seed: Buffer): PrivateKey {
        return keyGen(seed);
    }

    public static sign(privateKey: PrivateKey, message: Buffer): JacobianPoint {
        return coreSignMpl(privateKey, message, popSchemeDst);
    }

    public static verify(
        publicKey: JacobianPoint,
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        return coreVerifyMpl(publicKey, message, signature, popSchemeDst);
    }

    public static aggregate(signatures: JacobianPoint[]): JacobianPoint {
        return coreAggregateMpl(signatures);
    }

    public static aggregateVerify(
        publicKeys: JacobianPoint[],
        messages: Buffer[],
        signature: JacobianPoint
    ): boolean {
        if (publicKeys.length !== messages.length || !publicKeys.length)
            return false;
        for (const message of messages) {
            for (const match of messages) {
                if (message !== match && message.equals(match)) return false;
            }
        }
        return coreAggregateVerify(
            publicKeys,
            messages,
            signature,
            popSchemeDst
        );
    }

    public static popProve(privateKey: PrivateKey): JacobianPoint {
        const publicKey = privateKey.getG1();
        return g2Map(publicKey.toBytes(), popSchemePopDst).multiply(
            privateKey.value
        );
    }

    public static popVerify(
        publicKey: JacobianPoint,
        proof: JacobianPoint
    ): boolean {
        try {
            assert(proof.isValid());
            assert(publicKey.isValid());
            const q = g2Map(publicKey.toBytes(), popSchemePopDst);
            const one = Fq12.nil.one(defaultEc.q);
            const pairingResult = atePairingMulti(
                [publicKey, JacobianPoint.generateG1().negate()],
                [q, proof]
            );
            return pairingResult.equals(one);
        } catch (e) {
            if (e instanceof AssertionError) return false;
            throw e;
        }
    }

    public static fastAggregateVerify(
        publicKeys: JacobianPoint[],
        message: Buffer,
        signature: JacobianPoint
    ): boolean {
        if (!publicKeys.length) return false;
        let aggregate = publicKeys[0];
        for (const publicKey of publicKeys.slice(1))
            aggregate = aggregate.add(publicKey);
        return coreVerifyMpl(aggregate, message, signature, popSchemeDst);
    }

    public static deriveChildSk(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSk(privateKey, index);
    }

    public static deriveChildSkUnhardened(
        privateKey: PrivateKey,
        index: number
    ): PrivateKey {
        return deriveChildSkUnhardened(privateKey, index);
    }

    public static deriveChildPkUnhardened(
        publicKey: JacobianPoint,
        index: number
    ): JacobianPoint {
        return deriveChildG1Unhardened(publicKey, index);
    }
}




export type Endian = 'little' | 'big';

export function flip(binary: string): string {
    return binary.replace(/[01]/g, (match) => (match === '0' ? '1' : '0'));
}

export function intBitLength(value: number): number {
    return Math.abs(value).toString(2).length;
}

export function bigIntBitLength(value: bigint): number {
    return (value < 0n ? -value : value).toString(2).length;
}

export function bigIntToBits(i: bigint): number[] {
    if (i < 1n) return [0];
    const bits: Array<number> = [];
    while (i !== 0n) {
        bits.push(Number(mod(i, 2n)));
        i /= 2n;
    }
    return bits.reverse();
}

export function intToBits(i: number): number[] {
    if (i < 1) return [0];
    const bits: Array<number> = [];
    while (i !== 0) {
        bits.push(Number(modNumber(i, 2)));
        i /= 2;
    }
    return bits.reverse();
}

export function intToBytes(
    value: number,
    size: number,
    endian: Endian,
    signed: boolean = false
): Buffer {
    if (value < 0 && !signed)
        throw new Error('Cannot convert negative number to unsigned.');
    if (Math.floor(value) !== value)
        throw new Error('Cannot convert floating point number.');
    let binary = Math.abs(value)
        .toString(2)
        .padStart(size * 8, '0');
    if (value < 0) {
        binary = (parseInt(flip(binary), 2) + 1)
            .toString(2)
            .padStart(size * 8, '0');
    }
    var bytes = binary.match(/[01]{8}/g)!.map((match) => parseInt(match, 2));
    if (endian === 'little') bytes.reverse();
    return Buffer.from(bytes);
}

export function bytesToInt(
    bytes: Buffer,
    endian: Endian,
    signed: boolean = false
): number {
    if (bytes.length === 0) return 0;
    const sign = bytes[endian === 'little' ? bytes.length - 1 : 0]
        .toString(2)
        .padStart(8, '0')[0];
    const byteList = endian === 'little' ? bytes.reverse() : bytes;
    let binary = '';
    for (const byte of byteList) binary += byte.toString(2).padStart(8, '0');
    if (sign === '1' && signed) {
        binary = (parseInt(flip(binary), 2) + 1)
            .toString(2)
            .padStart(bytes.length * 8, '0');
    }
    const result = parseInt(binary, 2);
    return sign === '1' && signed ? -result : result;
}

export function encodeInt(value: number): Buffer {
    if (value === 0) return Buffer.from([]);
    const length = (intBitLength(value) + 8) >> 3;
    let bytes = intToBytes(value, length, 'big', true);
    while (
        bytes.length > 1 &&
        bytes[0] === ((bytes[1] & 0x80) !== 0 ? 0xff : 0)
    )
        bytes = bytes.slice(1);
    return bytes;
}

export function decodeInt(bytes: Buffer): number {
    return bytesToInt(bytes, 'big', true);
}

export function bigIntToBytes(
    value: bigint,
    size: number,
    endian: Endian,
    signed: boolean = false
): Buffer {
    if (value < 0n && !signed)
        throw new Error('Cannot convert negative number to unsigned.');
    let binary = (value < 0n ? -value : value)
        .toString(2)
        .padStart(size * 8, '0');
    if (value < 0) {
        binary = (BigInt('0b' + flip(binary)) + 1n)
            .toString(2)
            .padStart(size * 8, '0');
    }
    var bytes = binary.match(/[01]{8}/g)!.map((match) => parseInt(match, 2));
    if (endian === 'little') bytes.reverse();
    return Buffer.from(bytes);
}

export function bytesToBigInt(
    bytes: Buffer,
    endian: Endian,
    signed: boolean = false
): bigint {
    if (bytes.length === 0) return 0n;
    const sign = bytes[endian === 'little' ? bytes.length - 1 : 0]
        .toString(2)
        .padStart(8, '0')[0];
    const byteList = endian === 'little' ? bytes.reverse() : bytes;
    let binary = '';
    for (const byte of byteList) binary += byte.toString(2).padStart(8, '0');
    if (sign === '1' && signed) {
        binary = (BigInt('0b' + flip(binary)) + 1n)
            .toString(2)
            .padStart(bytes.length * 8, '0');
    }
    const result = BigInt('0b' + binary);
    return sign === '1' && signed ? -result : result;
}

export function encodeBigInt(value: bigint): Buffer {
    if (value === 0n) return Buffer.from([]);
    const length = (bigIntBitLength(value) + 8) >> 3;
    let bytes = bigIntToBytes(value, length, 'big', true);
    while (
        bytes.length > 1 &&
        bytes[0] === ((bytes[1] & 0x80) !== 0 ? 0xff : 0)
    )
        bytes = bytes.slice(1);
    return bytes;
}

export function decodeBigInt(bytes: Buffer): bigint {
    return bytesToBigInt(bytes, 'big', true);
}

export function concatBytes(...lists: Buffer[]): Buffer {
    const bytes: Array<number> = [];
    for (const list of lists) {
        for (const byte of list) bytes.push(byte);
    }
    return Buffer.from(bytes);
}


undefined


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


undefined


export function I2OSP(value: bigint, length: number): Buffer {
    if (value < 0n || value >= 1n << (8n * BigInt(length)))
        throw new Error(`Bad I2OSP call: value=${value}, length=${length}.`);
    const bytes: Array<number> = [];
    for (let i = 0; i < length; i++) bytes.push(0);
    let tempValue = value;
    for (let i = length - 1; i >= 0; i--) {
        bytes[i] = Number(tempValue & 0xffn);
        tempValue >>= 8n;
    }
    const result = Buffer.from(bytes);
    const toBytesValue = bigIntToBytes(value, length, 'big');
    assert.deepEqual(result, toBytesValue);
    return result;
}

export function OS2IP(octets: Buffer): bigint {
    let result = 0n;
    for (const octet of octets) {
        result <<= 8n;
        result += BigInt(octet);
    }
    assert.equal(result, bytesToBigInt(octets, 'big'));
    return result;
}

export function bytesXor(a: Buffer, b: Buffer): Buffer {
    return Buffer.from(a.map((element, i) => element ^ b[i]));
}

export function expandMessageXmd(
    message: Buffer,
    dst: Buffer,
    length: number,
    hash: HashInfo
): Buffer {
    const ell = Math.trunc((length + hash.byteSize - 1) / hash.byteSize);
    if (ell > 255)
        throw new Error(`Bad expandMessageXmd call: ell=${ell} out of range.`);
    const dst_prime = [...dst, ...I2OSP(BigInt(dst.length), 1)];
    const Z_pad = I2OSP(0n, hash.blockSize);
    const lib_str = I2OSP(BigInt(length), 2);
    const b_0 = hash.convert(
        Buffer.from([
            ...Z_pad,
            ...message,
            ...lib_str,
            ...I2OSP(0n, 1),
            ...dst_prime,
        ])
    );
    const bValues: Array<Buffer> = [];
    bValues.push(
        hash.convert(Buffer.from([...b_0, ...I2OSP(1n, 1), ...dst_prime]))
    );
    for (let i = 1; i <= ell; i++) {
        bValues.push(
            hash.convert(
                Buffer.from([
                    ...bytesXor(b_0, bValues[i - 1]),
                    ...I2OSP(BigInt(i + 1), 1),
                    ...dst_prime,
                ])
            )
        );
    }
    const pseudoRandomBytes: Array<number> = [];
    for (const item of bValues) pseudoRandomBytes.push(...item);
    return Buffer.from(pseudoRandomBytes.slice(0, length));
}

export function expandMessageXof(
    message: Buffer,
    dst: Buffer,
    length: number,
    hash: HashInfo
): Buffer {
    const dst_prime = [...dst, ...I2OSP(BigInt(dst.length), 1)];
    const message_prime = [
        ...message,
        ...I2OSP(BigInt(length), 2),
        ...dst_prime,
    ];
    return hash.convert(Buffer.from(message_prime)).slice(0, length);
}

export function hashToField(
    message: Buffer,
    count: number,
    dst: Buffer,
    modulus: bigint,
    degree: number,
    byteLength: number,
    expand: (
        message: Buffer,
        dst: Buffer,
        length: number,
        hash: HashInfo
    ) => Buffer,
    hash: HashInfo
): bigint[][] {
    const lengthInBytes = count * degree * byteLength;
    const pseudoRandomBytes = expand(message, dst, lengthInBytes, hash);
    const uValues: Array<Array<bigint>> = [];
    for (let i = 0; i < count; i++) {
        const eValues: Array<bigint> = [];
        for (let j = 0; j < degree; j++) {
            const elmOffset = byteLength * (j + i * degree);
            const tv = pseudoRandomBytes.slice(
                elmOffset,
                elmOffset + byteLength
            );
            eValues.push(mod(OS2IP(tv), modulus));
        }
        uValues.push(eValues);
    }
    return uValues;
}

export function Hp(message: Buffer, count: number, dst: Buffer): bigint[][] {
    return hashToField(message, count, dst, q, 1, 64, expandMessageXmd, sha256);
}

export function Hp2(message: Buffer, count: number, dst: Buffer): bigint[][] {
    return hashToField(message, count, dst, q, 2, 64, expandMessageXmd, sha256);
}




export function keyGen(seed: Buffer): PrivateKey {
    const length = 48;
    const okm = extractExpand(
        length,
        Buffer.from([...seed, 0]),
        Buffer.from('BLS-SIG-KEYGEN-SALT-', 'utf-8'),
        Buffer.from([0, length])
    );
    return new PrivateKey(mod(bytesToBigInt(okm, 'big'), defaultEc.n));
}

export function ikmToLamportSk(ikm: Buffer, salt: Buffer): Buffer {
    return extractExpand(32 * 255, ikm, salt, Buffer.from([]));
}

export function parentSkToLamportPk(
    parentSk: PrivateKey,
    index: number
): Buffer {
    const salt = intToBytes(index, 4, 'big');
    const ikm = parentSk.toBytes();
    const notIkm = Buffer.from(ikm.map((e) => e ^ 0xff));
    const lamport0 = ikmToLamportSk(ikm, salt);
    const lamport1 = ikmToLamportSk(notIkm, salt);
    const lamportPk: Array<number> = [];
    for (let i = 0; i < 255; i++)
        lamportPk.push(...hash256(lamport0.slice(i * 32, (i + 1) * 32)));
    for (let i = 0; i < 255; i++)
        lamportPk.push(...hash256(lamport1.slice(i * 32, (i + 1) * 32)));
    return hash256(Buffer.from(lamportPk));
}

export function deriveChildSk(parentSk: PrivateKey, index: number): PrivateKey {
    return keyGen(parentSkToLamportPk(parentSk, index));
}

export function deriveChildSkUnhardened(
    parentSk: PrivateKey,
    index: number
): PrivateKey {
    const hash = hash256(
        Buffer.from([
            ...parentSk.getG1().toBytes(),
            ...intToBytes(index, 4, 'big'),
        ])
    );
    return PrivateKey.aggregate([PrivateKey.fromBytes(hash), parentSk]);
}

export function deriveChildG1Unhardened(
    parentPk: JacobianPoint,
    index: number
): JacobianPoint {
    const hash = hash256(
        Buffer.from([...parentPk.toBytes(), ...intToBytes(index, 4, 'big')])
    );
    return parentPk.add(
        JacobianPoint.generateG1().multiply(PrivateKey.fromBytes(hash).value)
    );
}

export function deriveChildG2Unhardened(
    parentPk: JacobianPoint,
    index: number
): JacobianPoint {
    const hash = hash256(
        Buffer.from([...parentPk.toBytes(), ...intToBytes(index, 4, 'big')])
    );
    return parentPk.add(
        JacobianPoint.generateG2().multiply(PrivateKey.fromBytes(hash).value)
    );
}


undefined
undefined

export const blockSize = 32;

export function extract(salt: Buffer, ikm: Buffer): Buffer {
    return createHmac('sha256', salt).update(ikm).digest();
}

export function expand(length: number, prk: Buffer, info: Buffer): Buffer {
    const blocks = Math.ceil(length / blockSize);
    let bytesWritten = 0;
    const okm: Array<number> = [];
    let temp = Buffer.from([]);
    for (let i = 1; i <= blocks; i++) {
        const hash = createHmac('sha256', prk);
        temp = hash
            .update(Buffer.from(i === 1 ? [...info, 1] : [...temp, ...info, i]))
            .digest();
        let toWrite = length - bytesWritten;
        if (toWrite > blockSize) toWrite = blockSize;
        okm.push(...temp.slice(0, toWrite));
        bytesWritten += toWrite;
    }
    assert.equal(bytesWritten, length);
    return Buffer.from(okm);
}

export function extractExpand(
    length: number,
    key: Buffer,
    salt: Buffer,
    info: Buffer
): Buffer {
    return expand(length, extract(salt, key), info);
}


undefined

export const hmacBlockSize = 64;

export function hash256(message: Buffer): Buffer {
    return createHash('sha256').update(message).digest();
}

export function hash512(message: Buffer): Buffer {
    return Buffer.from([
        ...hash256(Buffer.from([...message, 0])),
        ...hash256(Buffer.from([...message, 1])),
    ]);
}

export function hmac256(message: Buffer, k: Buffer): Buffer {
    if (k.length > hmacBlockSize) k = hash256(k);
    while (k.length < hmacBlockSize) k = Buffer.from([...k, 0]);
    const kopad: Array<number> = [];
    for (let i = 0; i < hmacBlockSize; i++) kopad.push(k[i] ^ 0x5c);
    const kipad: Array<number> = [];
    for (let i = 0; i < hmacBlockSize; i++) kipad.push(k[i] ^ 0x36);
    return hash256(
        Buffer.from([...kopad, ...hash256(Buffer.from([...kipad, ...message]))])
    );
}


export function modPow(base: bigint, exponent: bigint, modulo: bigint): bigint {
    if (exponent < 1n) return 1n;
    else if (base < 0n || base > modulo) base = mod(base, modulo);
    let result = 1n;
    while (exponent > 0n) {
        if ((exponent & 1n) > 0n) result = mod(result * base, modulo);
        exponent >>= 1n;
        base = mod(base * base, modulo);
    }
    return result;
}

export function mod(value: bigint, modulus: bigint): bigint {
    return ((value % modulus) + modulus) % modulus;
}

export function modNumber(value: number, modulus: number): number {
    return ((value % modulus) + modulus) % modulus;
}


undefined


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
            assert.equal(sgn0(y0), sgn0(t));
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
            assert.equal(sgn0(y1), sgn0(t));
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

export function g2Map(alpha: Buffer, dst: Buffer): JacobianPoint {
    const elements = Hp2(alpha, 2, dst).map((hh) => {
        const items = hh.map((value) => new Fq(q, value));
        return new Fq2(q, items[0], items[1]);
    });
    return optSwu2Map(elements[0], elements[1]);
}




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


undefined


export function coreSignMpl(
    sk: PrivateKey,
    message: Buffer,
    dst: Buffer
): JacobianPoint {
    return g2Map(message, dst).multiply(sk.value);
}

export function coreVerifyMpl(
    pk: JacobianPoint,
    message: Buffer,
    signature: JacobianPoint,
    dst: Buffer
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
    ms: Buffer[],
    signature: JacobianPoint,
    dst: Buffer
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
