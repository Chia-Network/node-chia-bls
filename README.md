# BLS Signatures

[![npm package](https://nodei.co/npm/chia-bls.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/chia-bls)

A browser friendly implementation of bls-signatures in TypeScript, based off of the [Python implementation](https://github.com/Chia-Network/bls-signatures/tree/main/python-impl).

## Introduction

BLS Signatures is a cryptographic library used by projects and blockchains such as the [Chia blockchain](https://chia.net). It is a type of [elliptic curve cryptography](https://en.wikipedia.org/wiki/Elliptic-curve_cryptography).

This particular implementation is written with TypeScript, and is not bindings to native code. This allows it to be used in the browser as well. However, if you prefer native bindings, you should check out [this library](https://github.com/Chia-Mine/bls-signatures) instead.

## Usage

In this library, bytes are stored using the `Uint8Array` typed array class from the ECMAScript specification for multiplatform support.

By design, the functions and methods exposed by this library are synchronous and everything is exported for ease of use.

Since it is written in TypeScript, there are built-in typings for IntelliSense. The following documentation is non-exhaustive, but should be enough for most uses.

## Documentation

-   [AugSchemeMPL](#augschemempl)
-   [BasicSchemeMPL](#basicschemempl)
-   [PopSchemeMPL](#popschemempl)
-   [PrivateKey](#privatekey)
-   [JacobianPoint](#jacobianpoint)
-   [Byte Utils](#byte-utils)

## AugSchemeMPL

This scheme is from the BLS spec in the IETF. AugSchemeMPL is used by the Chia Network and is more secure but less efficient.

### static keygen(seed)

-   `seed` is a `Uint8Array`.
-   Returns a `PrivateKey`.

### static sign(privateKey, message)

-   `privateKey` is a `PrivateKey`.
-   `message` is a `Uint8Array`.
-   Returns a `JacobianPoint` signature.

### static sign_prepend(privateKey, message, prependPublicKey)

-   `privateKey` is a `PrivateKey`.
-   `message` is a `Uint8Array`.
-   `prependPublicKey` is a `JacobianPoint` public key.
-   Returns a `JacobianPoint` signature.

### static verify(publicKey, message, signature)

-   `publicKey` is a `JacobianPoint` public key.
-   `message` is a `Uint8Array`.
-   `signature` is a `JacobianPoint` signature.
-   Returns a `boolean` for if the signature is valid.

### static aggregate(signatures)

-   `signatures` is an `Array<JacobianPoint>` of signatures.
-   Returns an aggregated `JacobianPoint`.

### static aggregateVerify(publicKeys, messages, signature)

-   `publicKeys` is an `Array<JacobianPoint>` of public keys.
-   `messages` is an `Array<Uint8Array>`.
-   `signature` is a `JacobianPoint` signature.
-   Returns a `boolean` for if the signatures are valid.

### deriveChildSk(privateKey, index)

-   `privateKey` is a `PrivateKey`.
-   `index` is a `number`.
-   Returns the hardened child `PrivateKey` at the index.

### deriveChildSkUnhardened(privateKey, index)

-   `privateKey` is a `PrivateKey`.
-   `index` is a `number`.
-   Returns the unhardened child `PrivateKey` at the index.

### deriveChildPkUnhardened(publicKey, index)

-   `publicKey` is a `JacobianPoint` public key.
-   `index` is a `number`.
-   Returns the unhardened child `JacobianPoint` public key at the index.

## BasicSchemeMPL

This scheme is from the BLS spec in the IETF. BasicSchemeMPL is very fast, but not as secure as the other schemes.

### static keygen(seed)

-   `seed` is a `Uint8Array`.
-   Returns a `PrivateKey`.

### static sign(privateKey, message)

-   `privateKey` is a `PrivateKey`.
-   `message` is a `Uint8Array`.
-   Returns a `JacobianPoint` signature.

### static verify(publicKey, message, signature)

-   `publicKey` is a `JacobianPoint` public key.
-   `message` is a `Uint8Array`.
-   `signature` is a `JacobianPoint` signature.
-   Returns a `boolean` for if the signature is valid.

### static aggregate(signatures)

-   `signatures` is an `Array<JacobianPoint>` of signatures.
-   Returns an aggregated `JacobianPoint`.

### static aggregateVerify(publicKeys, messages, signature)

-   `publicKeys` is an `Array<JacobianPoint>` of public keys.
-   `messages` is an `Array<Uint8Array>`.
-   `signature` is a `JacobianPoint` signature.
-   Returns a `boolean` for if the signatures are valid.

### deriveChildSk(privateKey, index)

-   `privateKey` is a `PrivateKey`.
-   `index` is a `number`.
-   Returns the hardened child `PrivateKey` at the index.

### deriveChildSkUnhardened(privateKey, index)

-   `privateKey` is a `PrivateKey`.
-   `index` is a `number`.
-   Returns the unhardened child `PrivateKey` at the index.

### deriveChildPkUnhardened(publicKey, index)

-   `publicKey` is a `JacobianPoint` public key.
-   `index` is a `number`.
-   Returns the unhardened child `JacobianPoint` public key at the index.

## PopSchemeMPL

This scheme is from the BLS spec in the IETF. PopSchemeMPL is secure, but it requires registration, for example with Ethereum 2.0 Proof of Stake.

### static keygen(seed)

-   `seed` is a `Uint8Array`.
-   Returns a `PrivateKey`.

### static sign(privateKey, message)

-   `privateKey` is a `PrivateKey`.
-   `message` is a `Uint8Array`.
-   Returns a `JacobianPoint` signature.

### static verify(publicKey, message, signature)

-   `publicKey` is a `JacobianPoint` public key.
-   `message` is a `Uint8Array`.
-   `signature` is a `JacobianPoint` signature.
-   Returns a `boolean` for if the signature is valid.

### static aggregate(signatures)

-   `signatures` is an `Array<JacobianPoint>` of signatures.
-   Returns an aggregated `JacobianPoint`.

### static aggregateVerify(publicKeys, messages, signature)

-   `publicKeys` is an `Array<JacobianPoint>` of public keys.
-   `messages` is an `Array<Uint8Array>`.
-   `signature` is a `JacobianPoint` signature.
-   Returns a `boolean` for if the signatures are valid.

### static popProve(privateKey)

-   `privateKey` is a `PrivateKey`.
-   Returns a `JacobianPoint` proof of possession.

### static popVerify(publicKey, proof)

-   `publicKey` is a `JacobianPoint` public key.
-   `proof` is a `JacobianPoint` proof of possession.
-   Returns a `boolean` for if the proof of possession is valid.

### static fastAggregateVerify(publicKeys, message, signature)

-   `publicKeys` is an `Array<JacobianPoint>` of public keys.
-   `message` is a `Uint8Array`.
-   `signature` is a `JacobianPoint`.
-   Returns a `boolean` for if the signature is valid.

### deriveChildSk(privateKey, index)

-   `privateKey` is a `PrivateKey`.
-   `index` is a `number`.
-   Returns the hardened child `PrivateKey` at the index.

### deriveChildSkUnhardened(privateKey, index)

-   `privateKey` is a `PrivateKey`.
-   `index` is a `number`.
-   Returns the unhardened child `PrivateKey` at the index.

### deriveChildPkUnhardened(publicKey, index)

-   `publicKey` is a `JacobianPoint` public key.
-   `index` is a `number`.
-   Returns the unhardened child `JacobianPoint` public key at the index.

## PrivateKey

### static fromBytes(bytes)

-   `bytes` is a `Uint8Array`.
-   Returns a `PrivateKey`.

### static fromHex(hex)

-   `hex` is a hex `string`.
-   Returns a `PrivateKey`.

### static fromSeed(seed)

-   `seed` is a `Uint8Array`.
-   Returns a `PrivateKey` derived from the seed.

### static fromBigInt(value)

-   `value` is a `bigint`.
-   Returns a `PrivateKey`.

### static aggregate(privateKeys)

-   `privateKeys` is an `Array<PrivateKey>`.
-   Returns an aggregated `PrivateKey`.

### constructor(value)

-   `value` is a `bigint`.

### getG1()

-   Returns a derived `JacobianPoint` public key.

### toBytes()

-   Returns a `Uint8Array` representation.

### toHex()

-   Returns a hex `string` representation.

### toString()

-   Returns a `string` representation.

### equals(value)

-   `value` is a `PrivateKey`.
-   Returns a `boolean` for if the values are equal.

## JacobianPoint

This represents both G1Element and G2Element values, which are used for public keys and signatures, respectively.

### static fromBytes(bytes, isExtension)

-   `bytes` is a `Uint8Array`.
-   `isExtension` is a `boolean`.
-   Returns a `JacobianPoint`.

### static fromHex(hex, isExtension)

-   `hex` is a hex `string`.
-   `isExtension` is a `boolean`.
-   Returns a `JacobianPoint`.

### static generateG1()

-   Returns a `JacobianPoint` G1Element.

### static generateG2()

-   Returns a `JacobianPoint` G2Element.

### static infinityG1()

-   Returns a `JacobianPoint` G1Element at infinity.

### static infinityG2()

-   Returns a `JacobianPoint` G2Element at infinity.

### static fromBytesG1(bytes)

-   `bytes` is a `Uint8Array`.
-   Returns a `JacobianPoint` G1Element.

### static fromBytesG2(bytes)

-   `bytes` is a `Uint8Array`.
-   Returns a `JacobianPoint` G2Element.

### static fromHexG1(hex)

-   `hex` is a hex `string`.
-   Returns a `JacobianPoint` G1Element.

### static fromHexG2(hex)

-   `hex` is a hex `string`.
-   Returns a `JacobianPoint` G2Element.

### constructor(x, y, z, isInfinity)

-   `x`, `y`, and `z` are `Fq` or `Fq2`.
-   `isInfinity` is a `boolean`.

### isOnCurve()

-   Returns a `boolean` for if the point is on curve.

### isValid()

-   Returns a `boolean` for if the point is valid.

### getFingerprint()

-   Returns a small `number` fingerprint that identifies the point.

### toAffine()

-   Returns an `AffinePoint` representation.

### toBytes()

-   Returns a `Uint8Array` representation.

### toHex()

-   Returns a hex `string` representation.

### toString()

-   Returns a `string` representation.

### double()

-   Returns a `JacobianPoint` that is double the value.

### negate()

-   Returns a `JacobianPoint` that is the opposite value.

### add(value)

-   `value` is a `JacobianPoint`.
-   Returns a `JacobianPoint` that is the sum of the points.

### multiply(value)

-   `value` is an `Fq` or `bigint`.
-   Returns a `JacobianPoint` that is scalar multiplied.

### equals(value)

-   `value` is a `JacobianPoint`.
-   Returns a `boolean` for if the values are equal.

### clone()

-   Returns an exact `JacobianPoint` clone.

## Byte Utils

This is a collection of byte utils that can be directly imported and called, and are not part of a class.

### intToBytes(value, size, endian, signed?)

-   `value` is a `number`.
-   `size` is a `number` of bytes.
-   `endian` is either `"big"` or `"little"`.
-   `signed` is a `boolean`, by default `false`.
-   Returns a `Uint8Array`.

### bytesToInt(bytes, endian, signed?)

-   `bytes` is a `Uint8Array`.
-   `endian` is either `"big"` or `"little"`.
-   `signed` is a `boolean`, by default `false`.
-   Returns a `number`.

### encodeInt(value)

-   `value` is a `number`.
-   Returns a `Uint8Array` encoded the way that Chia Network's CLVM does.

### decodeInt(bytes)

-   `bytes` is a `Uint8Array`.
-   Returns a `number` decoded the way that Chia Network's CLVM does.

### bigIntToBytes(value, size, endian, signed?)

-   `value` is a `bigint`.
-   `size` is a `number` of bytes.
-   `endian` is either `"big"` or `"little"`.
-   `signed` is a `boolean`, by default `false`.
-   Returns a `Uint8Array`.

### bytesToBigInt(bytes, endian, signed?)

-   `bytes` is a `Uint8Array`.
-   `endian` is either `"big"` or `"little"`.
-   `signed` is a `boolean`, by default `false`.
-   Returns a `bigint`.

### encodeBigInt(value)

-   `value` is a `bigint`.
-   Returns a `Uint8Array` encoded the way that Chia Network's CLVM does.

### decodeBigInt(bytes)

-   `bytes` is a `Uint8Array`.
-   Returns a `bigint` decoded the way that Chia Network's CLVM does.

### concatBytes(...lists)

-   `lists` is an `Array<Uint8Array>`.
-   Returns a concatenated `Uint8Array`.

### bytesEqual(a, b)

-   `a` is a `Uint8Array`.
-   `b` is a `Uint8Array`.
-   Returns a `boolean` for if the bytes are exactly equal.

### toHex(bytes)

-   `bytes` is a `Uint8Array`.
-   Returns a hex `string`.

### fromHex(hex)

-   `hex` is a hex `string`.
-   Returns a `Uint8Array`.
