/**
 * Holds information about a page of data when doing pagination type requests.
 */
export interface PageInfoModel {
	/**
	 * The start cursor of a single page.
	 */
	startCursor?: string;

	/**
	 * The end cursor of a single page.
	 */
	endCursor?: string;

	/**
	 * True if there is a another page.
	 */
	hasNextPage: boolean;

	/**
	 * True if there is a previous page.
	 */
	hasPreviousPage: boolean;
}
