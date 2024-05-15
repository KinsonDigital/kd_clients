import { RawGitBranchModel } from "./mod.ts";

/**
 * Represents the raw git branch refs model that is unchanged from the GraphQL query.
 */
export interface RawRefsGetBranchModel {
	/**
	 * Gets or sets the git branch ref nodes.
	 */
	nodes: RawGitBranchModel[];
}
