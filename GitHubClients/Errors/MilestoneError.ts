/**
 * Error thrown when there is an error with the milestone client.
 */
export class MilestoneError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "MilestoneError";
	}
}
