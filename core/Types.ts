import type { IssueModel } from "../deps.ts";
import type { PullRequestModel } from "../deps.ts";

/**
 * Represents a GitHub issue or pull request.
 */
export type ItemType = "issue" | "pull-request";

/**
 * Represents the state of a GitHub issue or pull request.
 */
export type State = "open" | "closed";

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

/**
 * Represents different string transformations.
 */
export type TransformType =
	/**
	 * Removes the trailing white space and line terminator characters from a string.
	 */
	| "TrimStart"
	| /**
	 * Trims new line characters from the start.
	 */ "TrimEnd"
	| /**
	 * Removes the leading and trailing white space and line terminator characters from a string.
	 */ "TrimBoth"
	| /**
	 * Converts the value to all uppercase.
	 */ "UpperCase"
	| /**
	 * Converts the value to all lowercase.
	 */ "LowerCase"
	| /**
	 * No transformation will be performed.
	 */ "None";
