/**
 * Gets the organizational project for an issue.
 * @param ownerName The owner of the organization.
 * @returns The list of projects.
 */
export const createGetIssueProjectsQuery = (ownerName: string, repoName: string, issueNumber: number): string => {
	return `{
		repository(owner: "${ownerName}", name: "${repoName}") {
			issue(number: ${issueNumber}) {
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
