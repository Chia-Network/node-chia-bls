import { EC, Fq, Fq2 } from '../internal';

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
