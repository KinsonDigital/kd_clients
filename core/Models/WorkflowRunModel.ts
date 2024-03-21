import { PullRequestModel } from "./mod.ts";

/**
 * Represents a single workflow run.
 */
export type WorkflowRunModel = {
	/**
	 * Gets or sets the id of the workflow run.
	 */
	id: number;

	/**
	 * Gets or sets the name of the workflow run.
	 */
	name: string;

	/**
	 * Gets or sets the display title of the workflow run.
	 */
	display_title: string;

	/**
	 * Gets or sets the created date of the workflow run.
	 */
	created_at: string;

	/**
	 * Gets or sets the head branch of the workflow run.
	 */
	head_branch: string;

	/**
	 * Gets or sets the status of the workflow run.
	 */
	status: string;

	/**
	 * Gets or sets the conclusion of the workflow run.
	 */
	conclusion?: string;

	/**
	 * Gets or sets the HTML URL of the workflow run.
	 */
	html_url: string;

	/**
	 * Gets or sets the pull request of the workflow run.
	 */
	pull_requests: PullRequestModel[];
};
