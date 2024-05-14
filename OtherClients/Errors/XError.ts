/**
 * Error thrown when there is an error with the X client.
 */
export class XError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "XError";
	}
}
