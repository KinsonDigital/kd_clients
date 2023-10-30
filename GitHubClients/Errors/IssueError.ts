/**
 * Error thrown when there is an error with the issue client.
 */
export class IssueError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "IssueError";
	}
}
