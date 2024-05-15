/**
 * Represents a git branch.
 */
export interface GitBranchModel {
	/**
	 * Gets or sets the global node ID of the branch.
	 */
	id: string;

	/**
	 * Gets or sets the name of the branch.
	 */
	name: string;

	/**
	 * Gets or sets the oid of the branch.
	 */
	oid: string;
}
