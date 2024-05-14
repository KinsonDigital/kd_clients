/**
 * Error thrown when there is an error with the nuget client.
 */
export class NuGetError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "NuGetError";
	}
}
