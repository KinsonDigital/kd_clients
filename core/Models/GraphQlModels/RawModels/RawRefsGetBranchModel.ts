import type { RawGitBranchModel } from "@gh-ql-models/RawModels/RawGitBranchModel.ts";

/**
 * Represents the raw git branch refs model that is unchanged from the GraphQL query.
 */
export interface RawRefsGetBranchModel {
	/**
	 * Gets or sets the git branch ref nodes.
	 */
	nodes: RawGitBranchModel[];
}
