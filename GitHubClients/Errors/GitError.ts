/**
 * Error thrown when there is an error with the GIT client.
 */
export class GitError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GitError";
	}
}
