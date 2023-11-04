/**
 * Error thrown when there is an error with the users client.
 */
export class UsersError extends Error {
	private readonly _httpStatusCode: number = 200;

	constructor(message: string, httpStatusCode?: number) {
		super(message);
		this.name = "UsersError";
		this._httpStatusCode = httpStatusCode ?? 200;
	}

	/**
	 * Gets the HTTP status code of the error.
	 */
	public get httpStatusCode(): number {
		return this.httpStatusCode;
	}
}
