/**
 * Represents a GitHub user.
 */
export type UserModel = {
	/**
	 * Gets or sets the user's ID.
	 */
	id: number;

	/**
	 * Gets or sets the user's node ID.
	 */
	node_id: string;

	/**
	 * Gets or sets the user's login.
	 */
	login: string;

	/**
	 * Gets or sets the GitHub profile URL.
	 */
	html_url: string;

	/**
	 * Gets or sets the user's name.
	 */
	name: string;
};
