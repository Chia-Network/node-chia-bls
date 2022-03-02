export class AssertionError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, AssertionError.prototype);
    }
}

export function assert(
    test: boolean,
    message: string = 'Assertion failed.'
): void {
    if (!test) throw new AssertionError(message);
}
