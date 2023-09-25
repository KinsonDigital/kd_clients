/**
 * Gets the organizational project for a pull request.
 * @param repoOwner The owner of the organization.
 * @returns The list of projects.
 */
export const createGetPullRequestProjectsQuery = (repoOwner: string, repoName: string, prNumber: number): string => {
	return `{
		repository(owner: "${repoOwner}", name: "${repoName}") {
			pullRequest(number: ${prNumber}) {
				projectsV2 (first: 100) {
					nodes {
						id
						number
						title
					}
				}
			}
		}
    }`;
};
