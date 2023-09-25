/**
 * Represents the JSON data returned when getting the contents of a GitHub repository file.
 */
export type FileContentModel = {
	/**
	 * Gets or sets the name of the file.
	 */
	name: string;

	/**
	 * Gets or sets the path of the file.
	 */
	path: string;

	/**
	 * Gets or sets the size of the file.
	 */
	size: number;

	/**
	 * Gets or sets the URL of the file.
	 */
	url: string;

	/**
	 * Gets or sets the HTML URL of the file.
	 */
	html_url: string;

	/**
	 * Gets or sets the download URL of the file.
	 */
	download_url: string;

	/**
	 * Gets or sets the content of the file.
	 */
	content: string;

	/**
	 * Gets or sets the blob sha of the file.
	 */
	sha: string;
};
