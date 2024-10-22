import { assert, expect } from 'chai';
import { describe } from 'mocha';
import randombytes from 'randombytes';
import {
    atePairing,
    AugSchemeMPL,
    BasicSchemeMPL,
    bytesEqual,
    bytesToBigInt,
    defaultEc,
    defaultEcTwist,
    expand,
    expandMessageXmd,
    extract,
    Fq,
    Fq12,
    Fq2,
    Fq6,
    fromHex,
    g2Map,
    JacobianPoint,
    PopSchemeMPL,
    PrivateKey,
    sha512,
    signFq2,
    yForX,
} from '../src';

const q = defaultEc.q;

interface HkdfIn {
    ikm: string;
    salt: string;
    info: string;
    prkExpected: string;
    okmExpected: string;
    length: number;
}

interface Eip2333In {
    seed: string;
    masterSk: string;
    childSk: string;
    childIndex: number;
}

describe('HKDF', () => {
    const tests: Array<HkdfIn> = [
        {
            ikm: '0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b',
            salt: '000102030405060708090a0b0c',
            info: 'f0f1f2f3f4f5f6f7f8f9',
            prkExpected:
                '077709362c2e32df0ddc3f0dc47bba6390b6c73bb50f9c3122ec844ad7c2b3e5',
            okmExpected:
                '3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865',
            length: 42,
        },
        {
            ikm: '000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f404142434445464748494a4b4c4d4e4f',
            salt: '606162636465666768696a6b6c6d6e6f707172737475767778797a7b7c7d7e7f808182838485868788898a8b8c8d8e8f909192939495969798999a9b9c9d9e9fa0a1a2a3a4a5a6a7a8a9aaabacadaeaf',
            info: 'b0b1b2b3b4b5b6b7b8b9babbbcbdbebfc0c1c2c3c4c5c6c7c8c9cacbcccdcecfd0d1d2d3d4d5d6d7d8d9dadbdcdddedfe0e1e2e3e4e5e6e7e8e9eaebecedeeeff0f1f2f3f4f5f6f7f8f9fafbfcfdfeff',
            prkExpected:
                '06a6b88c5853361a06104c9ceb35b45cef760014904671014a193f40c15fc244',
            okmExpected:
                'b11e398dc80327a1c8e7f78c596a49344f012eda2d4efad8a050cc4c19afa97c59045a99cac7827271cb41c65e590e09da3275600c2f09b8367793a9aca3db71cc30c58179ec3e87c14c01d5c1f3434f1d87',
            length: 82,
        },
        {
            ikm: '0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b0b',
            salt: '',
            info: '',
            prkExpected:
                '19ef24a32c717b167f33a91d6f648bdf96596776afdb6377ac434c1c293ccb04',
            okmExpected:
                '8da4e775a563c18f715f802a063c5a31b8a11f5c5ee1879ec3454e5f3c738d2d9d201395faa4b61a96c8',
            length: 42,
        },
        {
            ikm: '8704f9ac024139fe62511375cf9bc534c0507dcf00c41603ac935cd5943ce0b4b88599390de14e743ca2f56a73a04eae13aa3f3b969b39d8701e0d69a6f8d42f',
            salt: '53d8e19b',
            info: '',
            prkExpected:
                'eb01c9cd916653df76ffa61b6ab8a74e254ebfd9bfc43e624cc12a72b0373dee',
            okmExpected:
                '8faabea85fc0c64e7ca86217cdc6dcdc88551c3244d56719e630a3521063082c46455c2fd5483811f9520a748f0099c1dfcfa52c54e1c22b5cdf70efb0f3c676',
            length: 64,
        },
    ];

    for (const test of tests) {
        describe(test.ikm, () => {
            const salt = fromHex(test.salt);
            const ikm = fromHex(test.ikm);
            const info = fromHex(test.info);
            const prkExpected = fromHex(test.prkExpected);
            const okmExpected = fromHex(test.okmExpected);
            const prk = extract(salt, ikm);
            const okm = expand(test.length, prk, info);
            it('Has the correct prkExpected length', () =>
                assert.equal(prkExpected.length, 32));
            it('Has the correct okmExpected length', () =>
                assert.equal(test.length, okmExpected.length));
            it('Has the correct prk bytes', () =>
                assert.deepEqual(prk, prkExpected));
            it('Has the correct okm bytes', () =>
                assert.deepEqual(okm, okmExpected));
        });
    }
});

describe('EIP 2333', () => {
    const tests: Array<Eip2333In> = [
        {
            seed: '3141592653589793238462643383279502884197169399375105820974944592',
            masterSk:
                '4ff5e145590ed7b71e577bb04032396d1619ff41cb4e350053ed2dce8d1efd1c',
            childSk:
                '5c62dcf9654481292aafa3348f1d1b0017bbfb44d6881d26d2b17836b38f204d',
            childIndex: 3141592653,
        },
        {
            seed: '0099FF991111002299DD7744EE3355BBDD8844115566CC55663355668888CC00',
            masterSk:
                '1ebd704b86732c3f05f30563dee6189838e73998ebc9c209ccff422adee10c4b',
            childSk:
                '1b98db8b24296038eae3f64c25d693a269ef1e4d7ae0f691c572a46cf3c0913c',
            childIndex: 4294967295,
        },
        {
            seed: 'd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3',
            masterSk:
                '614d21b10c0e4996ac0608e0e7452d5720d95d20fe03c59a3321000a42432e1a',
            childSk:
                '08de7136e4afc56ae3ec03b20517d9c1232705a747f588fd17832f36ae337526',
            childIndex: 42,
        },
        {
            seed: 'c55257c360c07c72029aebc1b53c05ed0362ada38ead3e3e9efa3708e53495531f09a6987599d18264c1e1c92f2cf141630c7a3c4ab7c81b2f001698e7463b04',
            masterSk:
                '0befcabff4a664461cc8f190cdd51c05621eb2837c71a1362df5b465a674ecfb',
            childSk:
                '1a1de3346883401f1e3b2281be5774080edb8e5ebe6f776b0f7af9fea942553a',
            childIndex: 0,
        },
    ];

    for (const test of tests) {
        describe(test.seed, () => {
            const seed = fromHex(test.seed);
            const master = BasicSchemeMPL.keyGen(seed);
            const child = BasicSchemeMPL.deriveChildSk(master, test.childIndex);
            it('Has the correct master length', () =>
                assert.equal(master.toBytes().length, 32));
            it('Has the correct child length', () =>
                assert.equal(child.toBytes().length, 32));
            it('Has the correct master bytes', () =>
                assert.deepEqual(master.toBytes(), fromHex(test.masterSk)));
            it('Has the correct child bytes', () =>
                assert.deepEqual(child.toBytes(), fromHex(test.childSk)));
        });
    }
});

describe('Fields', () => {
    const a = new Fq(17n, 30n);
    const b = new Fq(17n, -18n);
    const c = new Fq2(17n, a, b);
    const d = new Fq2(17n, a.add(a) as Fq, new Fq(17n, -5n));
    const e = c.multiply(d) as Fq2;
    const f = e.multiply(d) as Fq2;
    it('Basic multiplication', () => assert(!f.equals(e)));
    const e_sq = e.multiply(e) as Fq2;
    const e_sqrt = e_sq.modSqrt();
    it('Square and root', () => assert(e_sqrt.pow(2n).equals(e_sq)));
    const a2 = new Fq(
        172487123095712930573140951348n,
        3012492130751239573498573249085723940848571098237509182375n
    );
    const b2 = new Fq(
        172487123095712930573140951348n,
        3432984572394572309458723045723849n
    );
    const c2 = new Fq2(172487123095712930573140951348n, a2, b2);
    it('Inequality', () => assert(!b2.equals(c2)));
    const g = new Fq6(17n, c, d, d.multiply(d).multiply(c) as Fq2);
    const h = new Fq6(
        17n,
        a.add(a.multiply(c)) as Fq2,
        c.multiply(b).multiply(a) as Fq2,
        b.multiply(b).multiply(d).multiply(new Fq(17n, 21n)) as Fq2
    );
    const i = new Fq12(17n, g, h);
    it('Double negation', () => assert(i.inverse().inverse().equals(i)));
    it('Inverse root identity', () =>
        assert(i.root.inverse().multiply(i.root).equals(Fq6.nil.one(17n))));
    const x = new Fq12(17n, Fq6.nil.zero(17n), i.root);
    it('Inverse identity', () =>
        assert(x.inverse().multiply(x).equals(Fq12.nil.one(17n))));
    const j = new Fq6(
        17n,
        a.add(a.multiply(c)) as Fq2,
        Fq2.nil.zero(17n),
        Fq2.nil.zero(17n)
    );
    const j2 = new Fq6(
        17n,
        a.add(a.multiply(c)) as Fq2,
        Fq2.nil.zero(17n),
        Fq2.nil.one(17n)
    );
    describe('Extension equality', () => {
        it('First equals element', () =>
            assert(j.equals(a.add(a.multiply(c)))));
        it('Second does not equal element', () =>
            assert(!j2.equals(a.add(a.multiply(c)))));
        it('First does not equal second', () => assert(!j.equals(j2)));
    });
    describe('Frob coeffs', () => {
        const one = new Fq(q, 1n);
        const two = one.add(one) as Fq;
        const a3 = new Fq2(q, two, two);
        const b3 = new Fq6(q, a3, a3, a3);
        const c3 = new Fq12(q, b3, b3);
        for (const base of [a3, b3, c3]) {
            for (let expo = 1; expo < base.extension; expo++) {
                it(`Extension ${base.extension} exponent ${expo} equality`, () =>
                    assert(
                        base.qiPower(expo).equals(base.pow(q ** BigInt(expo)))
                    ));
            }
        }
    });
});

describe('Elliptic curve', () => {
    const g = JacobianPoint.generateG1();
    describe('G1 multiplication', () => {
        it('Is on curve', () => assert(g.isOnCurve()));
        it('Double same as addition', () =>
            assert(g.multiply(2n).equals(g.add(g))));
        it('Triple on curve', () => assert(g.multiply(3n).isOnCurve()));
        it('Triple same as addition', () =>
            assert(g.multiply(3n).equals(g.add(g).add(g))));
    });
    const g2 = JacobianPoint.generateG2();
    describe('Commutative', () => {
        it('Individual multiplication', () =>
            assert(
                g2.x
                    .multiply(new Fq(q, 2n).multiply(g2.y))
                    .equals(new Fq(q, 2n).multiply(g2.x.multiply(g2.y)))
            ));
        it('Is on curve', () => assert(g2.isOnCurve()));
    });
    const s = g2.add(g2);
    describe('Twist', () => {
        it('Untwist identity', () =>
            assert(s.toAffine().twist().untwist().equals(s.toAffine())));
        it('Multiplication without twist identity', () =>
            assert(
                s
                    .toAffine()
                    .twist()
                    .multiply(5n)
                    .untwist()
                    .equals(s.multiply(5n).toAffine())
            ));
        it('Multiplication with twist identity', () =>
            assert(
                s
                    .toAffine()
                    .twist()
                    .multiply(5n)
                    .equals(s.multiply(5n).toAffine().twist())
            ));
    });
    describe('G2 multiplication', () => {
        it('Is on curve', () => assert(g2.isOnCurve()));
        it('Double on curve', () => assert(s.isOnCurve()));
        it('Double same as addition', () =>
            assert(g2.add(g2).equals(g2.multiply(2n))));
        it('Five multiplication and addition', () =>
            assert(
                g2
                    .multiply(5n)
                    .equals(g2.multiply(2n).add(g2.multiply(2n)).add(g2))
            ));
    });
    const y = yForX(g2.x, defaultEcTwist);
    it('Y for X', () => assert(y.equals(g2.y) || y.negate().equals(g2.y)));
    const g_j = JacobianPoint.generateG1();
    const g2_j = JacobianPoint.generateG2();
    const g2_j2 = JacobianPoint.generateG2().multiply(2n);
    describe('Conversions', () => {
        it('Back and forth', () => assert(g.toAffine().toJacobian().equals(g)));
        it('Multiplication order', () =>
            assert(
                g_j.multiply(2n).toAffine().equals(g.toAffine().multiply(2n))
            ));
        it('Addition order and identity', () =>
            assert(
                g2_j.add(g2_j2).toAffine().equals(g2.toAffine().multiply(3n))
            ));
    });
});

describe('Edge case sign Fq2', () => {
    const a = new Fq(q, 62323n);
    const testCase1 = new Fq2(q, a, new Fq(q, 0n));
    const testCase2 = new Fq2(q, a.negate(), new Fq(q, 0n));
    it('First not second', () =>
        assert(signFq2(testCase1) !== signFq2(testCase2)));
    const testCase3 = new Fq2(q, new Fq(q, 0n), a);
    const testCase4 = new Fq2(q, new Fq(q, 0n), a.negate());
    it('Third not fourth', () =>
        assert(signFq2(testCase3) !== signFq2(testCase4)));
});

describe('XMD', () => {
    const msg = Uint8Array.from(randombytes(48));
    const dst = Uint8Array.from(randombytes(16));
    const ress: Map<Uint8Array, number> = new Map();
    it('Lengths are correct', () => {
        for (let length = 16; length < 8192; length++) {
            const result = expandMessageXmd(msg, dst, length, sha512);
            it('Has the correct length', () =>
                assert(length === result.length));
            let key = result.slice(0, 16);
            key =
                [...ress.keys()].find((buffer) => bytesEqual(key, buffer)) ??
                key;
            ress.set(key, (ress.get(key) ?? 0) + 1);
        }
    });
    it('All ones', () => {
        for (const item of ress.values()) {
            assert(item === 1);
        }
    });
});

describe('SWU', () => {
    const dst_1 = new TextEncoder().encode(
        'QUUX-V01-CS02-with-BLS12381G2_XMD:SHA-256_SSWU_RO_'
    );
    const msg_1 = new TextEncoder().encode('abcdef0123456789');
    const res = g2Map(msg_1, dst_1).toAffine();
    it('First x element is correct', () =>
        assert(
            (res.x as Fq2).elements[0].value ===
                0x121982811d2491fde9ba7ed31ef9ca474f0e1501297f68c298e9f4c0028add35aea8bb83d53c08cfc007c1e005723cd0n
        ));
    it('Second x element is correct', () =>
        assert(
            (res.x as Fq2).elements[1].value ===
                0x190d119345b94fbd15497bcba94ecf7db2cbfd1e1fe7da034d26cbba169fb3968288b3fafb265f9ebd380512a71c3f2cn
        ));
    it('First y element is correct', () =>
        assert(
            (res.y as Fq2).elements[0].value ===
                0x05571a0f8d3c08d094576981f4a3b8eda0a8e771fcdcc8ecceaf1356a6acf17574518acb506e435b639353c2e14827c8n
        ));
    it('Second y element is correct', () =>
        assert(
            (res.y as Fq2).elements[1].value ===
                0x0bb5e7572275c567462d91807de765611490205a941a5a6af3b1691bfe596c31225d3aabdf15faff860cb4ef17c7c3ben
        ));
});

describe('Elements', () => {
    const i1 = bytesToBigInt(Uint8Array.from([1, 2]), 'big');
    const i2 = bytesToBigInt(Uint8Array.from([3, 1, 4, 1, 5, 9]), 'big');
    const b1 = i1;
    const b2 = i2;
    const g1 = JacobianPoint.generateG1();
    const g2 = JacobianPoint.generateG2();
    const u1 = JacobianPoint.infinityG1();
    const u2 = JacobianPoint.infinityG2();
    const x1 = g1.multiply(b1);
    const x2 = g1.multiply(b2);
    const y1 = g2.multiply(b1);
    const y2 = g2.multiply(b2);
    describe('G1 multiplication equality', () => {
        it('Inequality', () => assert(!x1.equals(x2)));
        it('Identity', () => assert(x1.multiply(b1).equals(x1.multiply(b1))));
        it('Inequality identity', () =>
            assert(!x1.multiply(b1).equals(x1.multiply(b2))));
    });
    const left = x1.add(u1);
    const right = x1;
    describe('G1 addition equality', () => {
        it('Equality', () => assert(left.equals(right)));
        it('Commutative', () => assert(x1.add(x2).equals(x2.add(x1))));
        it('Negated addition', () => assert(x1.add(x1.negate()).equals(u1)));
        it('Byte conversion', () =>
            assert(x1.equals(JacobianPoint.fromBytesG1(x1.toBytes()))));
    });
    const copy = x1.clone();
    const new_x1 = x1.add(x2);
    describe('G1 copy', () => {
        it('Equality', () => assert(x1.equals(copy)));
        it('Inequality', () => assert(!new_x1.equals(copy)));
    });
    describe('G2 multiplication equality', () => {
        it('Inequality', () => assert(!y1.equals(y2)));
        it('Identity', () => assert(y1.multiply(b1).equals(y1.multiply(b1))));
        it('Inequality identity', () =>
            assert(!y1.multiply(b1).equals(y1.multiply(b2))));
    });
    describe('G2 addition equality', () => {
        it('Infinity addition', () => assert(y1.add(u2).equals(y1)));
        it('Commutative', () => assert(y1.add(y2).equals(y2.add(y1))));
        it('Negated addition', () => assert(y1.add(y1.negate()).equals(u2)));
        it('Byte conversion', () =>
            assert(y1.equals(JacobianPoint.fromBytesG2(y1.toBytes()))));
    });
    const copy2 = y1.clone();
    const new_y1 = y1.add(y2);
    describe('G2 copy', () => {
        it('Equality', () => assert(y1.equals(copy2)));
        it('Inequality', () => assert(!new_y1.equals(copy2)));
    });
    const pair = atePairing(x1, y1);
    describe('Ate pairing', () => {
        it('Inequality X', () => assert(!pair.equals(atePairing(x2, y1))));
        it('Inequality Y', () => assert(!pair.equals(atePairing(x1, y2))));
        const copy3 = pair.clone();
        it('Clone equality', () => assert(pair.equals(copy3)));
        const sk = 728934712938472938472398074n;
        const pk = g1.multiply(sk);
        const Hm = y2
            .multiply(12371928312n)
            .add(y2.multiply(12903812903891023n));
        const sig = Hm.multiply(sk);
        it('Equality', () => {
            assert(atePairing(g1, sig).equals(atePairing(pk, Hm)));
        });
    });
});

describe('Chia vectors 1', () => {
    const seed1 = Uint8Array.from(Array(32).fill(0));
    const seed2 = Uint8Array.from(Array(32).fill(1));
    const msg1 = Uint8Array.from([7, 8, 9]);
    const msg2 = Uint8Array.from([10, 11, 12]);
    const sk1 = BasicSchemeMPL.keyGen(seed1);
    const sk2 = BasicSchemeMPL.keyGen(seed2);
    describe('Keys', () => {
        it('Private key correct', () =>
            assert.equal(
                sk1.toHex(),
                '4a353be3dac091a0a7e640620372f5e1e2e4401717c1e79cac6ffba8f6905604'
            ));
        it('Public key correct', () =>
            assert.equal(
                sk1.getG1().toHex(),
                '85695fcbc06cc4c4c9451f4dce21cbf8de3e5a13bf48f44cdbb18e2038ba7b8bb1632d7911ef1e2e08749bddbf165352'
            ));
    });
    const sig1 = BasicSchemeMPL.sign(sk1, msg1);
    const sig2 = BasicSchemeMPL.sign(sk2, msg2);
    describe('Signatures', () => {
        it('First correct', () =>
            assert.equal(
                sig1.toHex(),
                'b8faa6d6a3881c9fdbad803b170d70ca5cbf1e6ba5a586262df368c75acd1d1ffa3ab6ee21c71f844494659878f5eb230c958dd576b08b8564aad2ee0992e85a1e565f299cd53a285de729937f70dc176a1f01432129bb2b94d3d5031f8065a1'
            ));
        it('Second correct', () =>
            assert.equal(
                sig2.toHex(),
                'a9c4d3e689b82c7ec7e838dac2380cb014f9a08f6cd6ba044c263746e39a8f7a60ffee4afb78f146c2e421360784d58f0029491e3bd8ab84f0011d258471ba4e87059de295d9aba845c044ee83f6cf2411efd379ef38bf4cf41d5f3c0ae1205d'
            ));
    });
    const aggSig1 = BasicSchemeMPL.aggregate([sig1, sig2]);
    describe('First aggregate signature', () => {
        it('Is correct', () =>
            assert.equal(
                aggSig1.toHex(),
                'aee003c8cdaf3531b6b0ca354031b0819f7586b5846796615aee8108fec75ef838d181f9d244a94d195d7b0231d4afcf06f27f0cc4d3c72162545c240de7d5034a7ef3a2a03c0159de982fbc2e7790aeb455e27beae91d64e077c70b5506dea3'
            ));
        it('Verification', () =>
            assert(
                BasicSchemeMPL.aggregateVerify(
                    [sk1.getG1(), sk2.getG1()],
                    [msg1, msg2],
                    aggSig1
                )
            ));
    });
    const msg3 = Uint8Array.from([1, 2, 3]);
    const msg4 = Uint8Array.from([1, 2, 3, 4]);
    const msg5 = Uint8Array.from([1, 2]);
    const sig3 = BasicSchemeMPL.sign(sk1, msg3);
    const sig4 = BasicSchemeMPL.sign(sk1, msg4);
    const sig5 = BasicSchemeMPL.sign(sk2, msg5);
    const aggSig2 = BasicSchemeMPL.aggregate([sig3, sig4, sig5]);
    describe('Second aggregate signature', () => {
        it('Is correct', () =>
            assert.equal(
                aggSig2.toHex(),
                'a0b1378d518bea4d1100adbc7bdbc4ff64f2c219ed6395cd36fe5d2aa44a4b8e710b607afd965e505a5ac3283291b75413d09478ab4b5cfbafbeea366de2d0c0bcf61deddaa521f6020460fd547ab37659ae207968b545727beba0a3c5572b9c'
            ));
        it('Verification', () =>
            assert(
                BasicSchemeMPL.aggregateVerify(
                    [sk1.getG1(), sk1.getG1(), sk2.getG1()],
                    [msg3, msg4, msg5],
                    aggSig2
                )
            ));
    });
});

describe('Chia vectors 3', () => {
    const seed1 = Uint8Array.from(Array(32).fill(4));
    const sk1 = PopSchemeMPL.keyGen(seed1);
    const proof = PopSchemeMPL.popProve(sk1);
    it('Proof correct', () =>
        assert.equal(
            proof.toHex(),
            '84f709159435f0dc73b3e8bf6c78d85282d19231555a8ee3b6e2573aaf66872d9203fefa1ef700e34e7c3f3fb28210100558c6871c53f1ef6055b9f06b0d1abe22ad584ad3b957f3018a8f58227c6c716b1e15791459850f2289168fa0cf9115'
        ));
});

describe('Pyecc vectors', () => {
    const ref_sig1Basic = Uint8Array.from(
        [
            ...'\x96\xba4\xfa\xc3<\x7f\x12\x9d`*\x0b\xc8\xa3\xd4?\x9a\xbc\x01N\xce\xaa\xb75\x91F\xb4\xb1P\xe5{\x80\x86Es\x8f5g\x1e\x9e\x10\xe0\xd8b\xa3\x0c\xabp\x07N\xb5\x83\x1d\x13\xe6\xa5\xb1b\xd0\x1e\xeb\xe6\x87\xd0\x16J\xdb\xd0\xa8d7\n|"*\'h\xd7pM\xa2T\xf1\xbf\x18#f[\xc26\x1f\x9d\xd8\xc0\x0e\x99',
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sig2Basic = Uint8Array.from(
        [
            ...'\xa4\x02y\t2\x13\x0fvj\xf1\x1b\xa7\x16Sf\x83\xd8\xc4\xcf\xa5\x19G\xe4\xf9\x08\x1f\xed\xd6\x92\xd6\xdc\x0c\xac[\x90K\xee^\xa6\xe2Ui\xe3m{\xe4\xcaY\x06\x9a\x96\xe3K\x7fp\x07X\xb7\x16\xf9IJ\xaaY\xa9nt\xd1J;U*\x9ak\xc1)\xe7\x17\x19[\x9d`\x06\xfdm\\\xefGh\xc0"\xe0\xf71j\xbf',
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sigABasic = Uint8Array.from(
        [
            ...'\x98|\xfd;\xcdb(\x02\x87\x02t\x83\xf2\x9cU$^\xd81\xf5\x1d\xd6\xbd\x99\x9ao\xf1\xa1\xf1\xf1\xf0\xb6Gw\x8b\x01g5\x9cqPUX\xa7n\x15\x8ef\x18\x1e\xe5\x12Y\x05\xa6B$k\x01\xe7\xfa^\xe5=h\xa4\xfe\x9b\xfb)\xa8\xe2f\x01\xf0\xb9\xadW}\xdd\x18\x87js1|!n\xa6\x1fC\x04\x14\xecQ\xc5',
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sig1Aug = Uint8Array.from(
        [
            ...'\x81\x80\xf0,\xcbr\xe9"\xb1R\xfc\xed\xbe\x0e\x1d\x19R\x105Opp6X\xe8\xe0\x8c\xbe\xbf\x11\xd4\x97\x0e\xabj\xc3\xcc\xf7\x15\xf3\xfb\x87m\xf9\xa9yz\xbd\x0c\x1a\xf6\x1a\xae\xad\xc9,,\xfe\\\nV\xc1F\xcc\x8c?qQ\xa0s\xcf_\x16\xdf8$g$\xc4\xae\xd7?\xf3\x0e\xf5\xda\xa6\xaa\xca\xed\x1a&\xec\xaa3k',
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sig2Aug = Uint8Array.from(
        [
            ...'\x99\x11\x1e\xea\xfbA-\xa6\x1eL7\xd3\xe8\x06\xc6\xfdj\xc9\xf3\x87\x0eT\xda\x92"\xbaNIH"\xc5\xb7eg1\xfazdY4\xd0KU\x9e\x92a\xb8b\x01\xbb\xeeW\x05RP\xa4Y\xa2\xda\x10\xe5\x1f\x9c\x1aiA)\x7f\xfc]\x97\nUr6\xd0\xbd\xeb|\xf8\xff\x18\x80\x0b\x08c8q\xa0\xf0\xa7\xeaB\xf4t\x80',
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sigAAug = Uint8Array.from(
        [
            ...'\x8c]\x03\xf9\xda\xe7~\x19\xa5\x94Z\x06\xa2\x14\x83n\xdb\x8e\x03\xb8QR]\x84\xb9\xded@\xe6\x8f\xc0\xcas\x03\xee\xed9\r\x86<\x9bU\xa8\xcfmY\x14\n\x01\xb5\x88G\x88\x1e\xb5\xafgsMD\xb2UVF\xc6al9\xab\x88\xd2S)\x9a\xcc\x1e\xb1\xb1\x9d\xdb\x9b\xfc\xbev\xe2\x8a\xdd\xf6q\xd1\x16\xc0R\xbb\x18G',
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sig1Pop = Uint8Array.from(
        [
            ...'\x95P\xfbN\x7f~\x8c\xc4\xa9\x0b\xe8V\n\xb5\xa7\x98\xb0\xb20\x00\xb6\xa5J!\x17R\x02\x10\xf9\x86\xf3\xf2\x81\xb3v\xf2Y\xc0\xb7\x80b\xd1\xeb1\x92\xb3\xd9\xbb\x04\x9fY\xec\xc1\xb0:pI\xebf^\r\xf3d\x94\xaeL\xb5\xf1\x13l\xca\xee\xfc\x99X\xcb0\xc33==C\xf0qH\xc3\x86)\x9a{\x1b\xfc\r\xc5\xcf|',
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sig2Pop = Uint8Array.from(
        [
            ..."\xa6\x906\xbc\x11\xae^\xfc\xbfa\x80\xaf\xe3\x9a\xdd\xde~'s\x1e\xc4\x02W\xbf\xdc<7\xf1{\x8d\xf6\x83\x06\xa3N\xbd\x10\xe9\xe3*5%7P\xdf\\\x87\xc2\x14/\x82\x07\xe8\xd5eG\x12\xb4\xe5T\xf5\x85\xfbhF\xff8\x04\xe4)\xa9\xf8\xa1\xb4\xc5ku\xd0\x86\x9e\xd6u\x80\xd7\x89\x87\x0b\xab\xe2\xc7\xc8\xa9\xd5\x1e{*",
        ].map((char) => char.charCodeAt(0))
    );
    const ref_sigAPop = Uint8Array.from(
        [
            ..."\xa4\xeat+\xcd\xc1U>\x9c\xa4\xe5`\xbe~^ln\xfajd\xdd\xdf\x9c\xa3\xbb(T#=\x85\xa6\xaa\xc1\xb7n\xc7\xd1\x03\xdbN3\x14\x8b\x82\xaf\x99#\xdb\x05\x93Jn\xce\x9aq\x01\xcd\x8a\x9dG\xce'\x97\x80V\xb0\xf5\x90\x00!\x81\x8cEi\x8a\xfd\xd6\xcf\x8ako\x7f\xee\x1f\x0bCqoU\xe4\x13\xd4\xb8z`9",
        ].map((char) => char.charCodeAt(0))
    );
    const secret1 = Uint8Array.from(Array(32).fill(1));
    const secret2 = Uint8Array.from(
        Array(32)
            .fill(0)
            .map((_, i) => (i * 314159) % 256)
    );
    const sk1 = PrivateKey.fromBytes(secret1);
    const sk2 = PrivateKey.fromBytes(secret2);
    const msg = Uint8Array.from([3, 1, 4, 1, 5, 9]);
    const sig1Basic = BasicSchemeMPL.sign(sk1, msg);
    const sig2Basic = BasicSchemeMPL.sign(sk2, msg);
    const sigABasic = BasicSchemeMPL.aggregate([sig1Basic, sig2Basic]);
    const sig1Aug = AugSchemeMPL.sign(sk1, msg);
    const sig2Aug = AugSchemeMPL.sign(sk2, msg);
    const sigAAug = AugSchemeMPL.aggregate([sig1Aug, sig2Aug]);
    const sig1Pop = PopSchemeMPL.sign(sk1, msg);
    const sig2Pop = PopSchemeMPL.sign(sk2, msg);
    const sigAPop = PopSchemeMPL.aggregate([sig1Pop, sig2Pop]);
    it('First basic signature', () =>
        assert.deepEqual(sig1Basic.toBytes(), ref_sig1Basic));
    it('Second basic signature', () =>
        assert.deepEqual(sig2Basic.toBytes(), ref_sig2Basic));
    it('Aggregate basic signature', () =>
        assert.deepEqual(sigABasic.toBytes(), ref_sigABasic));
    it('First aug signature', () =>
        assert.deepEqual(sig1Aug.toBytes(), ref_sig1Aug));
    it('Second aug signature', () =>
        assert.deepEqual(sig2Aug.toBytes(), ref_sig2Aug));
    it('Aggregate aug signature', () =>
        assert.deepEqual(sigAAug.toBytes(), ref_sigAAug));
    it('First pop signature', () =>
        assert.deepEqual(sig1Pop.toBytes(), ref_sig1Pop));
    it('Second pop signature', () =>
        assert.deepEqual(sig2Pop.toBytes(), ref_sig2Pop));
    it('Aggregate pop signature', () =>
        assert.deepEqual(sigAPop.toBytes(), ref_sigAPop));
});

describe('Invalid vectors', () => {
    const invalidInputs1 = [
        'c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        'c00000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000',
        '3a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa',
        '7a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa',
        'fa0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaa',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaaaa',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab',
    ];
    const invalidInputs2 = [
        'c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        'c00000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        'c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000',
        '3a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '7a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        'fa0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaa7',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        '9a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaaa1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaab',
    ];
    for (const [i, input] of invalidInputs1.entries()) {
        const bytes = fromHex(input);
        it(`G1 element ${i}`, () =>
            expect(() =>
                assert(JacobianPoint.fromBytesG1(bytes).isValid())
            ).to.throw());
    }
    for (const [i, input] of invalidInputs2.entries()) {
        const bytes = fromHex(input);
        it(`G2 element ${i}`, () =>
            expect(() =>
                assert(JacobianPoint.fromBytesG2(bytes).isValid())
            ).to.throw());
    }
});

describe('Readme', () => {
    const seed = Uint8Array.from([
        0, 50, 6, 244, 24, 199, 1, 25, 52, 88, 192, 19, 18, 12, 89, 6, 220, 18,
        102, 58, 209, 82, 12, 62, 89, 110, 182, 9, 44, 20, 254, 22,
    ]);
    const sk = AugSchemeMPL.keyGen(seed);
    const pk = sk.getG1();
    const message = Uint8Array.from([1, 2, 3, 4, 5]);
    const signature = AugSchemeMPL.sign(sk, message);
    it('AugSchemeMPL verify', () =>
        assert(AugSchemeMPL.verify(pk, message, signature)));
    const skBytes = sk.toBytes();
    const pkBytes = pk.toBytes();
    const signatureBytes = signature.toBytes();
    const skFromBytes = PrivateKey.fromBytes(skBytes);
    const pkFromBytes = JacobianPoint.fromBytesG1(pkBytes);
    const signatureFromBytes = JacobianPoint.fromBytesG2(signatureBytes);
    describe('From bytes', () => {
        it('Private key correct', () => assert(sk.equals(skFromBytes)));
        it('Public key correct', () => assert(pk.equals(pkFromBytes)));
        it('Signature correct', () =>
            assert(signature.equals(signatureFromBytes)));
    });
    const seed1 = Uint8Array.from([1, ...seed.slice(1)]);
    const sk1 = AugSchemeMPL.keyGen(seed1);
    const seed2 = Uint8Array.from([2, ...seed.slice(1)]);
    const sk2 = AugSchemeMPL.keyGen(seed2);
    const message2 = Uint8Array.from([1, 2, 3, 4, 5, 6, 7]);
    const pk1 = sk1.getG1();
    const sig1 = AugSchemeMPL.sign(sk1, message);
    const pk2 = sk2.getG1();
    const sig2 = AugSchemeMPL.sign(sk2, message2);
    const aggSig = AugSchemeMPL.aggregate([sig1, sig2]);
    it('First aug aggregate verify', () =>
        assert(
            AugSchemeMPL.aggregateVerify(
                [pk1, pk2],
                [message, message2],
                aggSig
            )
        ));
    const seed3 = Uint8Array.from([3, ...seed.slice(1)]);
    const sk3 = AugSchemeMPL.keyGen(seed3);
    const pk3 = sk3.getG1();
    const message3 = Uint8Array.from([100, 2, 254, 88, 90, 45, 23]);
    const sig3 = AugSchemeMPL.sign(sk3, message3);
    const aggSigFinal = AugSchemeMPL.aggregate([aggSig, sig3]);
    it('Second aug aggregate verify', () =>
        assert(
            AugSchemeMPL.aggregateVerify(
                [pk1, pk2, pk3],
                [message, message2, message3],
                aggSigFinal
            )
        ));
    const popSig1 = PopSchemeMPL.sign(sk1, message);
    const popSig2 = PopSchemeMPL.sign(sk2, message);
    const popSig3 = PopSchemeMPL.sign(sk3, message);
    const pop1 = PopSchemeMPL.popProve(sk1);
    const pop2 = PopSchemeMPL.popProve(sk2);
    const pop3 = PopSchemeMPL.popProve(sk3);
    describe('PopSchemeMPL prove', () => {
        it('First pop verify', () => assert(PopSchemeMPL.popVerify(pk1, pop1)));
        it('Second pop verify', () =>
            assert(PopSchemeMPL.popVerify(pk2, pop2)));
        it('Third pop verify', () => assert(PopSchemeMPL.popVerify(pk3, pop3)));
    });
    const popSigAgg = PopSchemeMPL.aggregate([popSig1, popSig2, popSig3]);
    it('PopSchemeMPL fast aggregate verify', () =>
        assert(
            PopSchemeMPL.fastAggregateVerify(
                [pk1, pk2, pk3],
                message,
                popSigAgg
            )
        ));
    const popAggPk = pk1.add(pk2).add(pk3);
    it('PopSchemeMPL verify', () =>
        assert(PopSchemeMPL.verify(popAggPk, message, popSigAgg)));
    const popAggSk = PrivateKey.aggregate([sk1, sk2, sk3]);
    it('PopSchemeMPL aggregate sign', () =>
        assert(PopSchemeMPL.sign(popAggSk, message).equals(popSigAgg)));
    const masterSk = AugSchemeMPL.keyGen(seed);
    const child = AugSchemeMPL.deriveChildSk(masterSk, 152);
    AugSchemeMPL.deriveChildSk(child, 952);
    const masterPk = masterSk.getG1();
    const childU = AugSchemeMPL.deriveChildSkUnhardened(masterSk, 22);
    const grandchildU = AugSchemeMPL.deriveChildSkUnhardened(childU, 0);
    const childUPk = AugSchemeMPL.deriveChildPkUnhardened(masterPk, 22);
    const grandchildUPk = AugSchemeMPL.deriveChildPkUnhardened(childUPk, 0);
    it('AugSchemeMPL child keys', () =>
        assert(grandchildUPk.equals(grandchildU.getG1())));
    const aggPk = pk1.add(pk2);
    const aggSig1 = AugSchemeMPL.sign_prepend(sk1, message, aggPk);
    const aggSig2 = AugSchemeMPL.sign_prepend(sk2, message, aggPk);
    var prependAggSig = AugSchemeMPL.aggregate([aggSig1, aggSig2]);
    it('AugSchemeMPL prepend verify', () =>
        assert(AugSchemeMPL.verify(aggPk, message, prependAggSig)));
});

describe('Current', () => {
    const seed = Uint8Array.from([
        0, 50, 6, 244, 24, 199, 1, 25, 52, 88, 192, 19, 18, 12, 89, 6, 220, 18,
        102, 58, 209, 82, 12, 62, 89, 110, 182, 9, 44, 20, 254, 22,
    ]);
    const sk = AugSchemeMPL.keyGen(seed);
    const pk = sk.getG1();
    const message = Uint8Array.from([1, 2, 3, 4, 5]);
    const signature = AugSchemeMPL.sign(sk, message);
    it('Is verified', () => AugSchemeMPL.verify(pk, message, signature));
});
