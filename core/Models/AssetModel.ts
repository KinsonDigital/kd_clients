/**
 * Represents a GitHub release asset.
 */
export interface AssetModel {
	/**
	 * Gets the url to the asset.
	 */
	url: string;

	/**
	 * Gets the id of the asset.
	 */
	id: number;

	/**
	 * Gets the node id of the asset.
	 */
	node_id: string;

	/**
	 * Gets the name of the asset.
	 */
	name: string;

	/**
	 * Gets the label or display name of asset.
	 */
	label: string;

	/**
	 * Gets the type of content of the asset.
	 */
	content_type: string;

	/**
	 * Gets the state of the asset.
	 */
	state: string;

	/**
	 * Gets the size of the asset in bytes.
	 */
	size: number;

	/**
	 * Gets the number of of times the asset has been downloaded.
	 */
	download_count: number;

	/**
	 * Gets the date and time the asset was created.
	 */
	created_at: string;

	/**
	 * Gets the date and time the asset was last updated.
	 */
	updated_at: string;

	/**
	 * Gets the browser download url of the asset.
	 */
	browser_download_url: string;
}
