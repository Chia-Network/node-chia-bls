export interface HashInfo {
    convert: (bytes: Uint8Array) => Uint8Array;
    byteSize: number;
    blockSize: number;
}
