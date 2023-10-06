import { Utils } from "core/Utils.ts";

/**
 * Get a list of branches for a GitHub repository.
 * @param repoOwner The owner of the repository.
 * @param repoName The name of the repository.
 * @param first The number of branches to get.
 * @param cursor The cursor to use for pagination.
 * @returns The list of branches.
 */
export const createGetBranchesQuery = (repoOwner: string, repoName: string, first?: number, cursor?: string): string => {
	first = !Utils.isNullOrEmptyOrUndefined(first) && first > 100 ? 100 : first;

	first = !Utils.isNullOrEmptyOrUndefined(first) && first <= 0 ? 1 : first;

	const firstValue = Utils.isNullOrEmptyOrUndefined(first) ? ", first: 100" : `, first: ${first}`;
	const cursorValue = Utils.isNullOrEmptyOrUndefined(cursor) ? "" : `, after: "${cursor}"`;

	return `{
        repository (owner: "${repoOwner}", name: "${repoName}") {
			refs (refPrefix: "refs/heads/"${firstValue}${cursorValue}, orderBy: { field: TAG_COMMIT_DATE, direction: DESC }) {
				nodes {
					id
					name
					target {
						... on Commit {
							oid
						}
					}
				}
				pageInfo {
					startCursor
					endCursor
					hasNextPage
					hasPreviousPage
				}
			}
		}
    }`;
};
