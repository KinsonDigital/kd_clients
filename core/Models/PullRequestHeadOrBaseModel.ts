import { RepoModel } from "models/RepoModel.ts";

/**
 * Holds information about a pull requests head or base branches.
 */
export type PullRequestHeadOrBaseModel = {
	/**
	 * Gets or sets the ref.
	 */
	ref: string;

	/**
	 * Gets or sets the GIT sha.
	 */
	sha: string;

	/**
	 * Gets or sets the repository info.
	 */
	repo: RepoModel;
};
