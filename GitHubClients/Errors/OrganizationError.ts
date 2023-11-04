/**
 * Error thrown when there is an error with the GitHub organization client.
 */
export class OrganizationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "OrganizationError";
	}
}
