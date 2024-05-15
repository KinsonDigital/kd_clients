/**
 * Represents a GitHub label.
 */
export interface LabelModel {
	/**
	 * The name of the label.
	 */
	name: string;

	/**
	 * The description of the label.
	 */
	description: string;

	/**
	 * Gets or sets the URL to the label.
	 */
	url: string;

	/**
	 * Gets or sets the id of the label.
	 */
	id: number;

	/**
	 * Gets or sets the node id of the label.
	 */
	node_id: string;

	/**
	 * Gets or sets the color of the label.
	 */
	color: string;

	/**
	 * Gets or sets the default value of the label.
	 */
	default: false;
}
