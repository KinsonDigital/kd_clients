import { RawGitBranchModel } from "models/GraphQlModels/RawModels/RawGitBranchModel.ts";

/**
 * Represents the raw git branch refs model that is unchanged from the GraphQL query.
 */
export type RawRefsGetBranchModel = {
	/**
	 * Gets or sets the git branch ref nodes.
	 */
	nodes: RawGitBranchModel[];
};
