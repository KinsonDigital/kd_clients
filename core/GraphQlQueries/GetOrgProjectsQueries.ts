/**
 * Get a list of the GitHub organization projects.
 * @param repoOwner The owner of the organization.
 * @returns The list of projects.
 */
export const createOrgProjectsQuery = (repoOwner: string): string => {
	return `{
        organization(login: "${repoOwner}") {
            projectsV2 (first: 100) {
                nodes {
                    id
                    number
                    title
                    url
                }
            }
        }
    }`;
};
