import SHA from 'jssha';
export const hmacBlockSize = 64;

export function hash256(message: Uint8Array): Uint8Array {
    const hash = new SHA('SHA-256', 'UINT8ARRAY');
    hash.update(message);
    return hash.getHash('UINT8ARRAY');
}

export function hash512(message: Uint8Array): Uint8Array {
    return Uint8Array.from([
        ...hash256(Uint8Array.from([...message, 0])),
        ...hash256(Uint8Array.from([...message, 1])),
    ]);
}

export function hmac256(message: Uint8Array, k: Uint8Array): Uint8Array {
    if (k.length > hmacBlockSize) k = hash256(k);
    while (k.length < hmacBlockSize) k = Uint8Array.from([...k, 0]);
    const kopad: Array<number> = [];
    for (let i = 0; i < hmacBlockSize; i++) kopad.push(k[i] ^ 0x5c);
    const kipad: Array<number> = [];
    for (let i = 0; i < hmacBlockSize; i++) kipad.push(k[i] ^ 0x36);
    return hash256(
        Uint8Array.from([
            ...kopad,
            ...hash256(Uint8Array.from([...kipad, ...message])),
        ])
    );
}
