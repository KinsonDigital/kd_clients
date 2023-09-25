import { Guard } from "../core/Guard.ts";
import { IssueModel } from "../core/Models/IssueModel.ts";
import { MilestoneModel } from "../core/Models/MilestoneModel.ts";
import { PullRequestModel } from "../core/Models/PullRequestModel.ts";
import { Utils } from "../core/Utils.ts";
import { GitHubHttpStatusCodes, IssueOrPRState, MergeState } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { IssueClient } from "./IssueClient.ts";
import { PullRequestClient } from "./PullRequestClient.ts";
import { IssueOrPR } from "../core/Types.ts";

/**
 * Provides a client for interacting with milestones.
 */
export class MilestoneClient extends GitHubClient {
	private readonly issueClient: IssueClient;
	private readonly prClient: PullRequestClient;

	/**
	 * Initializes a new instance of the {@link MilestoneClient} class.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(token?: string) {
		super(token);
		this.issueClient = new IssueClient(token);
		this.prClient = new PullRequestClient(token);
	}

	/**
	 * Gets all of the issues and pull requests for a milestone that matches the given {@link milestoneName}
	 * in a repository that matches the given {@link repoName}.
	 * @param repoName The name of the repo.
	 * @param milestoneName The name of the milestone to get issues for.
	 * @returns The issues in the milestone.
	 * @remarks Does not require authentication.
	 */
	public async getIssuesAndPullRequests(
		repoName: string,
		milestoneName: string,
		labels?: string[],
	): Promise<IssueOrPR[]> {
		const funcName = "getIssuesAndPullRequests";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(milestoneName, funcName, "milestoneName");

		const issuesAndPullRequests: (IssueOrPR)[] = [];

		const issuesPromise = this.getIssues(repoName, milestoneName, labels);
		const pullRequestsPromise = this.getPullRequests(repoName, milestoneName, labels);

		await Promise.all([issuesPromise, pullRequestsPromise]).then((values) => {
			issuesAndPullRequests.push(...values[0], ...values[1]);
		}).catch((error) => {
			Utils.printAsGitHubError(`The request to get issues returned error '${error}'`);
			Deno.exit(1);
		});

		return issuesAndPullRequests;
	}

	/**
	 * Gets all of the issues for a milestone that matches the given {@link milestoneName}
	 * in a repository that matches the given {@link repoName}.
	 * @param repoName The name of the repo.
	 * @param milestoneName The name of the milestone to get issues for.
	 * @param labels The labels to filter the issues by.
	 * @returns The issues in the milestone.
	 * @remarks Does not require authentication.
	 */
	public async getIssues(repoName: string, milestoneName: string, labels?: string[]): Promise<IssueModel[]> {
		const funcName = "getIssues";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(milestoneName, funcName, "milestoneName");

		const milestone: MilestoneModel = await this.getMilestoneByName(repoName, milestoneName);

		return await this.getAllData<IssueModel>(async (page, qtyPerPage) => {
			return await this.issueClient.getIssues(
				repoName,
				page,
				qtyPerPage,
				IssueOrPRState.any,
				labels,
				milestone.number,
			);
		});
	}

	/**
	 * Gets all of the pull requests for a milestone that matches the given {@link milestoneName}
	 * in a repository that matches the given {@link repoName}.
	 * @param repoName The name of the repo.
	 * @param milestoneName The name of the milestone to get pull requests for.
	 * @param labels The labels to filter the pull requests by.
	 * @returns The pull requests in the milestone.
	 * @remarks Does not require authentication.
	 */
	public async getPullRequests(
		repoName: string,
		milestoneName: string,
		labels?: string[],
	): Promise<PullRequestModel[]> {
		const funcName = "getPullRequests";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(milestoneName, funcName, "milestoneName");

		const milestone: MilestoneModel = await this.getMilestoneByName(repoName, milestoneName);

		return await this.getAllData<PullRequestModel>(async (page, qtyPerPage) => {
			return await this.prClient.getPullRequests(
				repoName,
				page,
				qtyPerPage,
				IssueOrPRState.any,
				MergeState.any,
				labels,
				milestone.number,
			);
		});
	}

	/**
	 * Get a milestones that matches the given {@link milestoneName} in a repository that matches the given {@link repoName}.
	 * @param repoName The name of the repository that the milestone exists in.
	 * @param milestoneName The name of the milestone.
	 * @returns The milestone.
	 * @remarks Does not require authentication.
	 */
	public async getMilestoneByName(repoName: string, milestoneName: string): Promise<MilestoneModel> {
		const funcName = "getMilestoneByName";
		Guard.isNullOrEmptyOrUndefined(repoName, funcName, "repoName");
		Guard.isNullOrEmptyOrUndefined(milestoneName, funcName, "milestoneName");

		milestoneName = milestoneName.trim();

		const milestones = await this.getAllDataUntil(
			async (page, qtyPerPage) => {
				return await this.getMilestones(repoName, page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(data: MilestoneModel[]) => {
				return data.some((m) => m.title.trim() === milestoneName);
			},
		);

		const milestone: MilestoneModel | undefined = milestones.find((m) => m.title.trim() === milestoneName);

		if (milestone === undefined) {
			const errorMsg = `The milestone '${milestoneName}' could not be found.`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		return milestone;
	}

	/**
	 * Gets a page of milestones with a {@link qtyPerPage}, in a repository with a name that matches the given {@link repoName}.
	 * @param repoName The name of the repository that the milestone exists in.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @remarks Does not require authentication.
	 */
	public async getMilestones(repoName: string, page: number, qtyPerPage: number): Promise<[MilestoneModel[], Response]> {
		Guard.isNullOrEmptyOrUndefined(repoName, "getMilestones", "repoName");

		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?state=all&page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/milestones${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			let errorMsg = `The milestones for the repository owner '${this.organization}'`;
			errorMsg += ` and for the repository '${repoName}' could not be found.`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		return [<MilestoneModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Checks if a milestone exists that matches in the given {@link milestoneName} in a repository that
	 * matches the given {@link repoName}.
	 * @param repoName The name of the repository that the milestone exists in.
	 * @param milestoneName The name of the milestone to check for.
	 * @remarks Does not require authentication.
	 */
	public async milestoneExists(repoName: string, milestoneName: string): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(repoName, "milestoneExists", "repoName");
		Guard.isNullOrEmptyOrUndefined(milestoneName, "milestoneExists", "milestoneName");

		milestoneName = milestoneName.trim();

		const milestones = await this.getAllDataUntil(
			async (page, qtyPerPage) => {
				return await this.getMilestones(repoName, page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(data: MilestoneModel[]) => {
				return data.some((m) => m.title.trim() === milestoneName);
			},
		);

		return milestones.find((m) => m.title.trim() === milestoneName) != undefined;
	}

	/**
	 * Creates a new milestone in a repository that matches the given {@link repoName}.
	 * @param repoName The name of the repository that the milestone exists in.
	 * @param milestoneName The name of the milestone to close.
	 * @remarks Requires authentication.
	 */
	public async closeMilestone(repoName: string, milestoneName: string): Promise<void> {
		Guard.isNullOrEmptyOrUndefined(repoName, "closeMilestone", "repoName");
		Guard.isNullOrEmptyOrUndefined(milestoneName, "closeMilestone", "milestoneName");

		repoName = repoName.trim();
		milestoneName = milestoneName.trim();

		const milestone: MilestoneModel = await this.getMilestoneByName(repoName, milestoneName);

		const url = `${this.baseUrl}/repos/${this.organization}/${repoName}/milestones/${milestone.number}`;
		const response: Response = await this.requestPATCH(url, JSON.stringify({ state: "closed" }));

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.OK) {
			Utils.printAsGitHubNotice(`✅The milestone '${milestoneName}' has been closed.✅`);
		} else if (response.status === GitHubHttpStatusCodes.NotFound) {
			Utils.printAsGitHubError(`The organization '${this.organization}' or repo '${repoName}' does not exist.`);
			Deno.exit(1);
		} else {
			let errorMsg = `An error occurred trying to close milestone '${milestoneName}(${milestone.number})'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}
}
