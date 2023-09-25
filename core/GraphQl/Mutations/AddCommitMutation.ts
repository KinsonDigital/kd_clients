/**
 * Creates a GraphQL mutation to add a commit to a branch that matches the given {@link branchName},
 * in a repository with a name that matches the given {@link repoName}, and that is owned by a GitHub
 * user with a login name that matches the given {@link repoOwner}.
 * @param repoOwner The owner of the repository.
 * @param repoName The name of the repository.
 * @param branchName The name of the branch.
 * @param branchHeadOid The OID of the head of the branch.
 * @param commitMessage The commit message.
 * @returns The GraphQL mutation.
 */
export const addCommitMutation = (
	repoOwner: string,
	repoName: string,
	branchName: string,
	branchHeadOid: string,
	commitMessage: string,
): string => {
	const repoNameWithOwner = `${repoOwner}/${repoName}`;

	return `mutation {
		createCommitOnBranch (input: {
			branch: { repositoryNameWithOwner: "${repoNameWithOwner}", branchName: "${branchName}" },
			expectedHeadOid: "${branchHeadOid}",
			message: { headline: "${commitMessage}" }
			fileChanges: { }
		}) {
			clientMutationId
				ref { id, name }
			commit { messageHeadline, messageBody }
		}
	}`;
};
