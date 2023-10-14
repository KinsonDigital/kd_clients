import { CommitModel } from "./CommitModel.ts";

/**
 * Represents a GIT tag.
 */
export type TagModel = {
	/**
	 * Gets or sets the tag name.
	 */
	name: string;

	/**
	 * Gets or sets the zipball url.
	 */
	zipball_url: string;

	/**
	 * Gets or sets the tarball url.
	 */
	tarball_url: string;

	/**
	 * Gets or sets the commit.
	 */
	commit: CommitModel;

	/**
	 * Gets or sets the node id.
	 */
	node_id: string;
};
