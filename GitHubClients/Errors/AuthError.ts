/**
 * Error thrown when there is an authentication error.
 */
export class AuthError extends Error {
	/**
	 * Initializes a new instance of the {@link AuthError} class.
	 * @param message The message of the error.
	 */
	constructor(message?: string) {
		const errorMessage = message === undefined
			? "Authentication error occurred. Please check your credentials and try again."
			: message;

		super(errorMessage);
		this.name = "AuthError";
	}
}
