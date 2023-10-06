import { GitHubVarModel } from "models/GitHubVarModel.ts";

/**
 * Represents multiple variables for an organization and/or repository.
 */
export type GitHubVariablesModel = {
	/**
	 * Gets or sets the total number of organization and/or repository variables.
	 */
	total_count: number;

	/**
	 * Gets or sets the list of variables for an organization and/or repository.
	 */
	variables: GitHubVarModel[];
};
