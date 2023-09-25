/**
 * Creates a GraphQL mutation to add an issue or pull request that has the given {@link nodeId} to
 * an organization project with the given {@link projectId}.
 * @param nodeId The issue or pull request node ID.
 * @param projectId The project node ID.
 * @returns The GraphQL mutation.
 */
export const createLinkItemToProjectMutation = (nodeId: string, projectId: string) => {
	return `mutation AddItemToOrgProject {
        addProjectV2ItemById(input: { contentId: "${nodeId}", projectId: "${projectId}" }) {
            item {
                id
            }
        }
    }`;
};
