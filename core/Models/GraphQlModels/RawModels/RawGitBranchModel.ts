import { RawGetBranchTargetModel } from "./mod.ts";

/**
 * Represents a raw git branch model that is unchanged from the GraphQL query.
 */
export type RawGitBranchModel = {
	/**
	 * Gets or sets the id of the branch.
	 */
	id: string;

	/**
	 * Gets or sets the name of the branch.
	 */
	name: string;

	/**
	 * Gets or sets the target of the branch.
	 */
	target: RawGetBranchTargetModel;
};
