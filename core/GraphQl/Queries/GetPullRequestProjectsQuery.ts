/**
 * Gets the organizational project for a pull request.
 * @param ownerName The owner of the organization.
 * @returns The list of projects.
 */
export const createGetPullRequestProjectsQuery = (ownerName: string, repoName: string, prNumber: number): string => {
	return `{
		repository(owner: "${ownerName}", name: "${repoName}") {
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
