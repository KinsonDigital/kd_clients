/**
 * Error thrown when there is an error with the pull request client.
 */
export class PullRequestError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "PullRequestError";
	}
}
