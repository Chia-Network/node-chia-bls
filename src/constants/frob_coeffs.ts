import { AnyField, Fq, Fq2, Fq6, q } from '../internal.js';

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
