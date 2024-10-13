import type { IssueModel } from "../deps.ts";
import type { PullRequestModel } from "../deps.ts";

/**
 * Represents a GitHub issue or pull request.
 */
export type ItemType = "issue" | "pull-request";

/**
 * Represents a GitHub issue or pull request.
 */
export type IssueOrPR = IssueModel | PullRequestModel;

/**
 * Represents any branch.
 */
export type AnyBranch = null;

/**
 * Represents a function for getting a page of data form a GitHub API end point.
 */
export type GetDataFunc<T> = (page: number, qtyPerPage?: number) => Promise<[T[], Response]>;

/**
 * Represents a bad credentials object returned from the GitHub GraphQL API.
 */
export type BadCredentials = {
	/**
	 * The documentation URL about the GraphQL API.
	 */
	documentation_url: string;

	/**
	 * The message about the bad credentials.
	 */
	message: string;
};
