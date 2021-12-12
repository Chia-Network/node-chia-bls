import { Fq, Fq2, q } from '../internal.js';

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
