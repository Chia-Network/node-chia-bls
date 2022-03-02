import { Fq, Fq2, q } from '../internal';

export const rv1 =
    0x6af0e0437ff400b6831e36d6bd17ffe48395dabc2d3435e77f76e17009241c5ee67992f72ec05f4c81084fbede3cc09n;

export const rootsOfUnity = [
    new Fq2(q, new Fq(q, 1n), new Fq(q, 0n)),
    new Fq2(q, new Fq(q, 0n), new Fq(q, 1n)),
    new Fq2(q, new Fq(q, rv1), new Fq(q, rv1)),
    new Fq2(q, new Fq(q, rv1), new Fq(q, q - rv1)),
];
