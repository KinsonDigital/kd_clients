/**
 * Error thrown when there is an error with the project client.
 */
export class ProjectError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ProjectError";
	}
}
