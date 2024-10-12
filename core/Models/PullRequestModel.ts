import type { LabelModel } from "./mod.ts";
import type { MilestoneModel } from "./mod.ts";
import type { PullRequestHeadOrBaseModel } from "./mod.ts";
import type { PullRequestInfoModel } from "./mod.ts";
import type { UserModel } from "./mod.ts";

/**
 * Represents a GitHub pull request.
 */
export interface PullRequestModel {
	/**
	 * Gets or sets the ID of the pull request.
	 */
	id: number;

	/**
	 * Gets or sets the node id of the pull request.
	 */
	node_id?: string;

	/**
	 * Gets or sets the title of the pull request.
	 */
	title?: string;

	/**
	 * Gets or sets the number of the pull request.
	 */
	number: number;

	/**
	 * Gets or sets the body of the issue.
	 */
	body: string;

	/**
	 * Gets or sets the list of pull request reviewers.
	 */
	requested_reviewers: UserModel[];

	/**
	 * Gets or sets the assignees.
	 */
	assignees: UserModel[];

	/**
	 * Gets or sets the labels of the pull request.
	 */
	labels: LabelModel[];

	/**
	 * Gets or sets the state of the pull request.
	 */
	state?: string;

	/**
	 * Gets or sets the URL to the pull request.
	 */
	url: string;

	/**
	 * Gets or sets the milestone.
	 */
	milestone?: MilestoneModel;

	/**
	 * Gets or sets the URL to the html page of the pull request.
	 */
	html_url?: string;

	/**
	 * Gets or sets if the pull request is a draft.
	 */
	draft?: boolean;

	/**
	 * Gets or sets additional information about the pull request.
	 */
	pull_request?: PullRequestInfoModel;

	/**
	 * Gets or sets the head branch of the pull request.
	 */
	head: PullRequestHeadOrBaseModel;

	/**
	 * Gets or sets the base branch of the pull request.
	 */
	base: PullRequestHeadOrBaseModel;
}
