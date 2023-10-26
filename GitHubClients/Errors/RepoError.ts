/**
 * Error thrown when there is an error with the repository client.
 */
export class RepoError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "RepoError";
	}
}
