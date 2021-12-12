import { Fq } from '../../internal.js';

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
