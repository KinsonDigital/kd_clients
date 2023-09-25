/**
 * Represents a response from the Github API.
 */
export interface GithubResponse {
	/**
	 * Gets the response message.
	 */
	message: string;

	/**
	 * Gets the documentation URL.
	 */
	documentation_url: string;
}
