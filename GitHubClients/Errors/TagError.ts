/**
 * Error thrown when there is an error with the tag client.
 */
export class TagError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "TagError";
	}
}
