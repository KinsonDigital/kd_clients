/**
 * Error thrown when there is a bad credentials error.
 */
export class BadCredentialsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "BadCredentialsError";
	}
}
