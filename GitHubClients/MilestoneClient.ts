import { Guard } from "../core/Guard.ts";
import { AuthError } from "../deps.ts";
import { Utils } from "../deps.ts";
import { GitHubHttpStatusCodes, IssueOrPRState, MergeState } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { IssueClient } from "./IssueClient.ts";
import { PullRequestClient } from "./PullRequestClient.ts";
import { MilestoneError } from "../deps.ts";
import type { IssueModel } from "../deps.ts";
import type { MilestoneModel } from "../deps.ts";
import type { PullRequestModel } from "../deps.ts";
import type { IssueOrPR } from "../core/Types.ts";

/**
 * Provides a client for interacting with milestones.
 */
export class MilestoneClient extends GitHubClient {
	private readonly issueClient: IssueClient;
	private readonly prClient: PullRequestClient;
	private readonly isInitialized: boolean = false;

	/**
	 * Initializes a new instance of the {@link MilestoneClient} class.
	 * @param ownerName The name of the owner of the repository to use.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 * @throws An {@link Error} if the parameters are undefined, null, or empty.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "MilestoneClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);

		this.issueClient = new IssueClient(ownerName, repoName, token);
		this.prClient = new PullRequestClient(ownerName, repoName, token);
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

		this.issueClient.ownerName = v;
		this.prClient.ownerName = v;
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

		this.issueClient.repoName = v;
		this.prClient.repoName = v;
	}

	/**
	 * Gets all of the issues and pull requests for a milestone with a name that matches the given {@link milestoneName},
	 * where the repository has a name that matches the given {@link MilestoneClient}.{@link repoName}.
	 * @param milestoneName The name of the milestone to get issues for.
	 * @returns The issues in the milestone.
	 * @remarks Does not require authentication.
	 */
	public async getIssuesAndPullRequests(
		milestoneName: string,
		labels?: string[],
	): Promise<IssueOrPR[]> {
		const funcName = "getIssuesAndPullRequests";
		Guard.isNothing(milestoneName, funcName, "milestoneName");

		const issuesAndPullRequests: (IssueOrPR)[] = [];

		const issuesPromise = this.getIssues(milestoneName, labels);
		const pullRequestsPromise = this.getPullRequests(milestoneName, labels);

		const issueOrPrs = await Promise.all([issuesPromise, pullRequestsPromise]);

		issuesAndPullRequests.push(...issueOrPrs[0], ...issueOrPrs[1]);

		return issuesAndPullRequests;
	}

	/**
	 * Gets all of the issues for a milestone with a name that matches the given {@link milestoneName},
	 * where the repository has a name that matches the given {@link MilestoneClient}.{@link repoName}.
	 * @param milestoneName The name of the milestone to get issues for.
	 * @param labels The labels to filter the issues by.
	 * @returns The issues in the milestone.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link MilestoneError}.
	 */
	public async getIssues(milestoneName: string, labels?: string[]): Promise<IssueModel[]> {
		const funcName = "getIssues";
		Guard.isNothing(milestoneName, funcName, "milestoneName");

		const milestone: MilestoneModel = await this.getMilestoneByName(milestoneName);

		let page = 1;
		const qtyPerPage = 100;
		const collectedIssues: IssueModel[] = [];

		while (true) {
			const issues = await this.issueClient.getIssues(
				page,
				qtyPerPage,
				IssueOrPRState.any,
				labels,
				milestone.number,
			);

			if (issues.length === 0) {
				return collectedIssues;
			} else {
				collectedIssues.push(...issues);
				page++;
			}
		}
	}

	/**
	 * Gets all of the pull requests with the given {@link labels}, for a milestone with a name
	 * that matches the given {@link milestoneName}, where the repository has a name that matches
	 * the given {@link MilestoneClient}.{@link repoName}.
	 * @param milestoneName The name of the milestone to get pull requests for.
	 * @param labels The labels to filter the pull requests by.
	 * @returns The pull requests in the milestone.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link MilestoneError}.
	 */
	public async getPullRequests(
		milestoneName: string,
		labels?: string[],
	): Promise<PullRequestModel[]> {
		const funcName = "getPullRequests";
		Guard.isNothing(milestoneName, funcName, "milestoneName");

		const milestone: MilestoneModel = await this.getMilestoneByName(milestoneName);

		let page = 1;
		const qtyPerPage = 100;
		const collectedPrs: PullRequestModel[] = [];

		while (true) {
			const prs = await this.prClient.getPullRequests(
				page,
				qtyPerPage,
				IssueOrPRState.any,
				MergeState.any,
				labels,
				milestone.number,
			);

			if (prs.length === 0) {
				return collectedPrs;
			} else {
				collectedPrs.push(...prs);
				page++;
			}
		}
	}

	/**
	 * Get a milestones with a name that matches the given {@link milestoneName}, where the repository has
	 * a name that matches the given {@link MilestoneClient}.{@link repoName}.
	 * @param milestoneName The name of the milestone.
	 * @returns The milestone.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link MilestoneError}.
	 */
	public async getMilestoneByName(milestoneName: string): Promise<MilestoneModel> {
		const funcName = "getMilestoneByName";
		Guard.isNothing(milestoneName, funcName, "milestoneName");

		milestoneName = milestoneName.trim();

		const milestones = await this.getAllDataUntil(
			async (page, qtyPerPage) => {
				return await this.getMilestones(page, qtyPerPage ?? 100);
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

			throw new MilestoneError(errorMsg);
		}

		return milestone;
	}

	/**
	 * Gets the given {@link page} of milestones with a quantity that the given {@link qtyPerPage}, where the repository
	 * has a name that matches the given {@link MilestoneClient}.{@link repoName}.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link MilestoneError}.
	 */
	public async getMilestones(page: number, qtyPerPage: number): Promise<[MilestoneModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?state=all&page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${super.ownerName}/${super.repoName}/milestones${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== GitHubHttpStatusCodes.OK) {
			let errorMsg = `The milestones for the repository owner '${super.ownerName}'`;
			errorMsg += ` and for the repository '${super.repoName}' could not be found.`;

			throw new MilestoneError(errorMsg);
		}

		return [<MilestoneModel[]> await this.getResponseData(response), response];
	}

	/**
	 * Checks if a milestone with a name that matches in the given {@link milestoneName}, exists in a repository
	 * with a name that matches the given {@link MilestoneClient}.{@link repoName}.
	 * @param milestoneName The name of the milestone to check for.
	 * @remarks Does not require authentication.|
	 * @throws An {@link AuthError} or {@link MilestoneError}.
	 */
	public async milestoneExists(milestoneName: string): Promise<boolean> {
		Guard.isNothing(milestoneName, "milestoneExists", "milestoneName");

		milestoneName = milestoneName.trim();

		const milestones = await this.getAllDataUntil(
			async (page, qtyPerPage) => {
				return await this.getMilestones(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(data: MilestoneModel[]) => {
				return data.some((m) => m.title.trim() === milestoneName);
			},
		);

		return milestones.find((m) => m.title.trim() === milestoneName) !== undefined;
	}

	/**
	 * Closes a milestone with a name that matches the given {@link milestoneName}, where the repository
	 * has a name that matches the given {@link MilestoneClient}.{@link repoName}.
	 * @param milestoneName The name of the milestone to close.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link MilestoneError}.
	 */
	public async closeMilestone(milestoneName: string): Promise<void> {
		Guard.isNothing(milestoneName, "closeMilestone", "milestoneName");

		milestoneName = milestoneName.trim();

		const milestone: MilestoneModel = await this.getMilestoneByName(milestoneName);

		const url = `${this.baseUrl}/repos/${super.ownerName}/${super.repoName}/milestones/${milestone.number}`;
		const response: Response = await this.requestPATCH(url, JSON.stringify({ state: "closed" }));

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== GitHubHttpStatusCodes.OK) {
			const errorMsg = this.buildErrorMsg(
				`An error occurred trying to close milestone '${milestoneName}(${milestone.number})'.`,
				response,
			);

			throw new MilestoneError(errorMsg);
		}
	}
}
