/**
 * Represents an GitHub organization repo.
 */
export type ProjectModel = {
	/**
	 * Gets or sets the ID of the repo.
	 */
	id: string;

	/**
	 * Gets or sets the number of the repo.
	 */
	number: number;

	/**
	 * Gets or sets the title of the repo.
	 */
	title: string;

	/**
	 * Gets or sets the URL to the repo.
	 */
	url: string;
};
