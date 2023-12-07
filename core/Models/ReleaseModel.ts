/**
 * Represents a GitHub release.
 */
export type ReleaseModel = {
	/**
	 * Gets or sets the release name.
	 */
	name: string;

	/**
	 * Gets or sets the release ID.
	 */
	id: number;

	/**
	 * Gets or sets the release tag name.
	 */
	tag_name: string;

	/**
	 * Gets or sets whether or not the release is a draft.
	 */
	draft: boolean;

	/**
	 * Gets or sets whether or not the release is a prerelease.
	 */
	prerelease: boolean;

	/**
	 * Gets or sets the URL to the GitHub webpage.
	 */
	html_url: string;
};
