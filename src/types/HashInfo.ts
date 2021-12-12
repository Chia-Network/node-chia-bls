export interface HashInfo {
    convert: (bytes: Buffer) => Buffer;
    byteSize: number;
    blockSize: number;
}
