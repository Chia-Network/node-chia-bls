import {
    AnyField,
    assert,
    Field,
    Fq,
    Fq12,
    Fq2,
    Fq6,
    fromHex,
    getFrobCoeff,
    modNumber,
    OperatorError,
    q,
    toHex,
} from '../../internal';

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

    public fromBytes(Q: bigint, bytes: Uint8Array): this {
        const length = this.extension * 48;
        if (bytes.length !== length) {
            throw new RangeError(`Expected ${length} bytes.`);
        }
        const embeddedSize = 48 * (this.extension / this.elements.length);
        const elements: Array<Uint8Array> = [];
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
        return this.fromBytes(Q, fromHex(hex));
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

    public toBytes(): Uint8Array {
        const bytes: Array<number> = [];
        for (let i = this.elements.length - 1; i >= 0; i--) {
            bytes.push(...this.elements[i].toBytes());
        }
        return Uint8Array.from(bytes);
    }

    public toBool(): boolean {
        return this.elements.findIndex((element) => !element.toBool()) === -1;
    }

    public toHex(): string {
        return toHex(this.toBytes());
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
