export const basicSchemeDst = new TextEncoder().encode(
    'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_'
);
export const augSchemeDst = new TextEncoder().encode(
    'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_AUG_'
);
export const popSchemeDst = new TextEncoder().encode(
    'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_'
);
export const popSchemePopDst = new TextEncoder().encode(
    'BLS_POP_BLS12381G2_XMD:SHA-256_SSWU_RO_POP_'
);
