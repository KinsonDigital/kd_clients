import { AuthError, GraphQlClient } from "../deps.ts";
import { createGetBranchesQuery } from "../core/GraphQl/Queries/GetBranchesQuery.ts";
import { Guard } from "../core/Guard.ts";
import { Utils } from "../deps.ts";
import { RepoClient } from "./RepoClient.ts";
import { getCreateBranchMutation } from "../core/GraphQl/Mutations/CreateBranchMutation.ts";
import { addCommitMutation } from "../core/GraphQl/Mutations/AddCommitMutation.ts";
import { GitError } from "../deps.ts";
import type { PageInfoModel } from "../deps.ts";
import type { GitBranchModel } from "../deps.ts";
import type { RawRefsGetBranchModel } from "../deps.ts";
import type { RawGitBranchModel } from "../deps.ts";

/**
 * Provides a client for to perform git operations for a GitHub repository.
 */
export class GitClient extends GraphQlClient {
	private readonly repoClient: RepoClient;
	private readonly isInitialized: boolean = false;

	/**
	 * Initializes a new instance of the {@link GitClient} class.
	 * @param ownerName The owner of the repository.
	 * @param repoName The name of the repository.
	 * @param token The GitHub token to use for authentication.
	 * @throws An {@link Error} if the parameters are undefined, null, or empty.
	 */
	constructor(ownerName: string, repoName: string, token: string) {
		const funcName = "GitClient.Ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);

		this.repoClient = new RepoClient(ownerName, repoName, token);
		this.isInitialized = true;
	}

	/**
	 * Sets the name of the owner of the repository.
	 */
	public override set ownerName(v: string) {
		Guard.isNothing("ownerName", v, "v");
		super.ownerName = v.trim();

		if (!this.isInitialized) {
			return;
		}

		this.repoClient.ownerName = v;
	}

	/**
	 * Sets the name of the repository.
	 */
	public override set repoName(v: string) {
		Guard.isNothing("repoName", v, "v");
		super.repoName = v.trim();

		if (!this.isInitialized) {
			return;
		}

		this.repoClient.repoName = v;
	}

	/**
	 * Gets a branch with the given branch {@link name}.
	 * @param name The name of the branch.
	 * @returns The branch.
	 * @throws An {@link AuthError} or {@link GitError}.
	 */
	public async getBranch(name: string): Promise<GitBranchModel> {
		Guard.isNothing(name, "getBranch", "name");

		const branches: GitBranchModel[] = await this.getBranches((branch) => branch.name === name);

		if (branches.length <= 0) {
			throw new GitError(`The branch '${name}' does not exist.`);
		}

		return branches.filter((branch) => branch.name === name)[0];
	}

	/**
	 * Gets a list of branches for a repository.
	 * @param untilPredicate Used to determine when to stop getting branches.
	 * @returns The list of branches for the repository.
	 * @remarks If the {@link untilPredicate} is not provided, all branches will be returned.
	 * @throws An {@link AuthError} or {@link GitError}.
	 */
	public async getBranches(untilPredicate?: (branch: GitBranchModel) => boolean): Promise<GitBranchModel[]> {
		const result: GitBranchModel[] = [];
		let pageInfo: PageInfoModel = { hasNextPage: true, hasPreviousPage: false };

		// As long as there is another page worth of information
		while (pageInfo.hasNextPage) {
			const cursor: string = Utils.isNothing(pageInfo.endCursor) ? "" : <string> pageInfo.endCursor;

			const query: string = result.length <= 0
				? createGetBranchesQuery(super.ownerName, super.repoName)
				: createGetBranchesQuery(super.ownerName, super.repoName, 100, cursor);

			const responseData = await this.executeQuery(query);

			if (responseData instanceof AuthError) {
				throw responseData;
			}

			if (responseData.errors !== undefined) {
				const mainMsg = `The following errors occurred while getting branches for the repository '${super.repoName}'`;
				const errorMsg = Utils.toErrorMessage(mainMsg, responseData);

				throw new GitError(errorMsg);
			}

			pageInfo = <PageInfoModel> responseData.data.repository.refs.pageInfo;

			const rawBranchData = <RawRefsGetBranchModel> responseData.data.repository.refs;

			const branches = <GitBranchModel[]> rawBranchData.nodes.map((node: RawGitBranchModel) => {
				return {
					id: node.id,
					name: node.name,
					oid: node.target.oid,
				};
			});

			for (let i = 0; i < branches.length; i++) {
				const branch = branches[i];

				const stopPulling: boolean = !Utils.isNothing(untilPredicate) && untilPredicate(branch);

				result.push(branch);

				if (stopPulling) {
					return result;
				}
			}
		}

		return result;
	}

	/**
	 * Gets all branches for the repository.
	 * @returns All branches for the repository.
	 */
	public async getAllBranches(): Promise<GitBranchModel[]> {
		return await this.getBranches();
	}

	/**
	 * Gets a value indicating whether or not a branch with the given branch {@link name} exists.
	 * @param name The name of the branch.
	 * @returns True if the branch exists; otherwise, false.
	 * @throws An {@link AuthError} or {@link GitError}.
	 */
	public async branchExists(name: string): Promise<boolean> {
		Guard.isNothing(name, "branchExists", "name");

		const branches: GitBranchModel[] = await this.getBranches((branch) => branch.name === name);

		return branches.some((branch) => branch.name === name);
	}

	/**
	 * Creates a branch with the given {@link newBranchName} from a branch that matches the given {@link branchFromName}.
	 * @param newBranchName The name of the branch.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link GitError}.
	 */
	public async createBranch(newBranchName: string, branchFromName: string): Promise<GitBranchModel> {
		const funcName = "createBranch";
		Guard.isNothing(newBranchName, funcName, "newBranchName");
		Guard.isNothing(branchFromName, funcName, "branchFromName");

		if (await this.branchExists(newBranchName)) {
			const errorMsg = `A branch with the name '${newBranchName}' already exists.`;
			throw new GitError(errorMsg);
		}

		const fromBranch = await this.getBranch(branchFromName);

		const repo = await this.repoClient.getRepo();

		if (Utils.isNothing(repo.node_id)) {
			const errorMsg = `The repository '${super.repoName}' did not return a required node ID.`;
			throw new GitError(errorMsg);
		}

		const mutation: string = getCreateBranchMutation(repo.node_id, newBranchName, fromBranch.oid);

		const responseData = await this.executeQuery(mutation);

		if (responseData instanceof AuthError) {
			throw responseData;
		}

		if (responseData.errors !== undefined) {
			const mainMsg = `The following errors occurred while creating the branch '${newBranchName}'`;
			const errorMsg = Utils.toErrorMessage(mainMsg, responseData);

			throw new GitError(errorMsg);
		}

		const newBranch = responseData.data.createRef.ref;

		return {
			id: newBranch.id,
			name: newBranch.name,
			oid: newBranch.target.oid,
		};
	}

	/**
	 * Adds a commit with the given {@link commitMessage} to a branch with the given {@link branchName}.
	 * @param branchName The name of the branch.
	 * @param commitMessage The commit message.
	 * @throws An {@link AuthError} or {@link GitError}.
	 */
	public async addCommit(branchName: string, commitMessage: string): Promise<void> {
		const funcName = "addCommit";
		Guard.isNothing(branchName, funcName, "branchName");
		Guard.isNothing(commitMessage, funcName, "commitMessage");

		const branch = await this.getBranch(branchName);

		const mutation = addCommitMutation(super.ownerName, super.repoName, branchName, branch.oid, commitMessage);

		const response = await this.executeQuery(mutation);

		if (response instanceof AuthError) {
			throw response;
		}

		if (response.errors !== undefined) {
			const mainMsg = `The following errors occurred while adding a commit to the branch '${branchName}'`;
			const errorMsg = Utils.toErrorMessage(mainMsg, response);

			throw new GitError(errorMsg);
		}
	}
}
