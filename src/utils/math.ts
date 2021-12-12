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
