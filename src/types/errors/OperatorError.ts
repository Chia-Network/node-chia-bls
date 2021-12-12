export class OperatorError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, OperatorError.prototype);
    }
}
