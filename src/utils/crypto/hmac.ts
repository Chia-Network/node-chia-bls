import { createHash } from 'crypto';

export const hmacBlockSize = 64;

export function hash256(message: Buffer): Buffer {
    return createHash('sha256').update(message).digest();
}

export function hash512(message: Buffer): Buffer {
    return Buffer.from([
        ...hash256(Buffer.from([...message, 0])),
        ...hash256(Buffer.from([...message, 1])),
    ]);
}

export function hmac256(message: Buffer, k: Buffer): Buffer {
    if (k.length > hmacBlockSize) k = hash256(k);
    while (k.length < hmacBlockSize) k = Buffer.from([...k, 0]);
    const kopad: Array<number> = [];
    for (let i = 0; i < hmacBlockSize; i++) kopad.push(k[i] ^ 0x5c);
    const kipad: Array<number> = [];
    for (let i = 0; i < hmacBlockSize; i++) kipad.push(k[i] ^ 0x36);
    return hash256(
        Buffer.from([...kopad, ...hash256(Buffer.from([...kipad, ...message]))])
    );
}
