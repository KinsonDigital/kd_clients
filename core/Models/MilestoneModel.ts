/**
 * Represents a GitHub milestone.
 */
export interface MilestoneModel {
	/**
	 * Gets or sets the title of the milestone.
	 */
	title: string;

	/**
	 * Gets or sets the number of the milestone.
	 */
	number: number;

	/**
	 * Gets or sets the URL of the milestone.
	 */
	url: string;

	/**
	 * Gets or sets the number of open issues for the milestone.
	 */
	open_issues: number;

	/**
	 * Gets or sets the number of closed issues for the milestone.
	 */
	closed_issues: number;
}
