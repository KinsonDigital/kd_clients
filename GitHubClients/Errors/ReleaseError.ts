/**
 * Error thrown when there is an error with the release client.
 */
export class ReleaseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ReleaseError";
	}
}
