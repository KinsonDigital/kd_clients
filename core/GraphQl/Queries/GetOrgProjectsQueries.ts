/**
 * Get a list of the GitHub organization projects.
 * @param ownerName The owner of the organization.
 * @returns The list of projects.
 */
export const createOrgProjectsQuery = (ownerName: string): string => {
	return `{
        organization(login: "${ownerName}") {
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
