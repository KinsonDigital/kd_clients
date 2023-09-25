import { IPageInfo } from "./PageInfo.ts";

/**
 * Represents a response link header from a GitHub API response
 * that contains pagination information.
 */
export interface LinkHeader {
	/**
	 * The previous page.
	 */
	prevPage: number;

	/**
	 * The next page.
	 */
	nextPage: number;

	/**
	 * The total number of pages.
	 */
	totalPages: number;

	/**
	 * All of the page info data.
	 */
	pageData: IPageInfo[];
}
