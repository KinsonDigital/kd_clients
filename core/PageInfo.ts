/**
 * Represent a combination of a pagination URL with metadata.
 */
export interface PageInfo {
	/**
	 * Gets or sets the pagination URL for the page.
	 */
	pageUrl: string;

	/**
	 * Gets or sets the metadata for the page.
	 */
	metadata: string;
}
