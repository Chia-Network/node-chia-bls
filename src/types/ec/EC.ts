import { AnyField, Fq, Fq2 } from '../../internal';

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
