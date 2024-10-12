import type { LabelModel } from "./mod.ts";
import type { MilestoneModel } from "./mod.ts";
import type { UserModel } from "./mod.ts";

/**
 * Represents a GitHub issue.
 */
export interface IssueModel {
	/**
	 * Gets or sets the number of the issue.
	 */
	number: number;

	/**
	 * Gets or sets the title of the issue.
	 */
	title?: string;

	/**
	 * Gets or sets the body of the issue.
	 */
	body: string;

	/**
	 * Gets or sets the labels of the issue.
	 */
	labels: LabelModel[];

	/**
	 * Gets or sets the state of the issue.
	 */
	state?: string;

	/**
	 * Gets or sets the URL to the html page of the issue.
	 */
	html_url?: string;

	/**
	 * Gets or sets the node ID of the issue.
	 */
	node_id?: string;

	/**
	 * Gets or sets the milestone.
	 */
	milestone?: MilestoneModel;

	/**
	 * Gets or sets the assignees.
	 */
	assignees: UserModel[];
}
