/**
 * Error thrown when there is an error with the workflow client.
 */
export class WorkflowError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "WorkflowError";
	}
}
