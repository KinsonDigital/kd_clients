import { IssueState, StateReason } from "./Enums.ts";

/**
 * Represents the body of an HTTP GitHub API issue request.
 * Used to update an issue or pull request.
 */
export interface IIssueOrPRRequestData {
	/**
	 * Gets or sets the title of the issue.
	 */
	title?: string | null | number;

	/**
	 * Gets or sets the contents of the issue.
	 */
	body?: string | null;

	/**
	 * Gets or sets the state of the issue.
	 * @remarks Can be one of: open, closed
	 */
	state?: IssueState;

	/**
	 * Gets or sets the reason for the state change.
	 * @remarks Ignored unless state has changed.
	 * Can be one of: completed, not_planned, reopened, null
	 */
	state_reason?: StateReason | null;

	/**
	 * Gets or sets the number of the milestone to associate the issue with.
	 * @remarks Use null to remove the current milestone. Only users with push access
	 * can set the milestone for issues. Without push access to the repository,
	 * milestone changes are silently dropped.
	 */
	milestone?: string | number | null;

	/**
	 * Gets or sets the labels associated with this issue.
	 * @remarks Pass one or more labels to replace the set of labels on this issue.
	 * Send an empty array ([]) to clear all labels from the issue. Only users with
	 * push access can set labels for issues. Without push access to the repository,
	 * label changes are silently dropped.
	 */
	labels?: string[];

	/**
	 * Gets or sets the usernames to assign to this issue.
	 * @remarks Pass one or more user logins to
	 * replace the set of assignees on this issue. Send an empty array ([]) to clear all assignees
	 * from the issue. Only users with push access can set assignees for new issues.
	 * Without push access to the repository, assignee changes are silently dropped.
	 */
	assignees?: string[];
}
