/**
 * Creates a GraphQL mutation to create a branch for a repository that matches the given {@link repoNodeId},
 * with a {@link newBranchName} and created from a branch with the given {@link createFromBranchOid}.
 * @returns The GraphQL mutation.
 */
export const getCreateBranchMutation = (repoNodeId: string, newBranchName: string, createFromBranchOid: string) => {
	const input = `input: {
		repositoryId: "${repoNodeId}",
		name: "refs/heads/${newBranchName}",
		oid: "${createFromBranchOid}"
	}`;

	return `mutation {
		createRef(${input}) {
			ref {
				id
				name
				target {
					oid
				}
			}
		}
    }`;
};
