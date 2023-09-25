/**
 * Gets the organizational project for an issue.
 * @param repoOwner The owner of the organization.
 * @returns The list of projects.
 */
export const createGetIssueProjectsQuery = (repoOwner: string, repoName: string, issueNumber: number): string => {
	return `{
		repository(owner: "${repoOwner}", name: "${repoName}") {
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
