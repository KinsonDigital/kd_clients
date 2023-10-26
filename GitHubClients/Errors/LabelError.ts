/**
 * Error thrown when there is an error with the label client.
 */
export class LabelError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LabelError";
	}
}
