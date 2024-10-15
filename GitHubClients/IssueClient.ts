import type { IssueModel, LabelModel } from "../deps.ts";
import type { IssueOrPRRequestData } from "../core/IssueOrPRRequestData.ts";
import { Guard } from "../core/Guard.ts";
import { LabelClient } from "./LabelClient.ts";
import { Utils } from "../deps.ts";
import { GitHubHttpStatusCodes, IssueOrPRState } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { IssueError } from "../deps.ts";
import { AuthError } from "./Errors/AuthError.ts";

/**
 * Provides a client for interacting with issues.
 */
export class IssueClient extends GitHubClient {
	private readonly labelClient: LabelClient;
	private readonly isInitialized: boolean = false;

	/**
	 * Initializes a new instance of the {@link IssueClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 * @throws An {@link Error} if the parameters are undefined, null, or empty.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "IssueClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);
		this.labelClient = new LabelClient(ownerName, repoName, token);
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

		this.labelClient.ownerName = v;
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

		this.labelClient.repoName = v;
	}

	/**
	 * Gets all of the open issues in a repository with a name that matches the given {@link IssueClient.repoName}.
	 * @returns The issues.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async getAllOpenIssues(): Promise<IssueModel[]> {
		return await this.getAllData<IssueModel>(async (page: number, qtyPerPage?: number) => {
			const [issues, response] = await this.getIssuesInternal(page, qtyPerPage);

			if (response.status !== GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(`An error occurred trying to get all of the opened issues.`, response);
				throw new IssueError(errorMsg);
			}

			return Promise.resolve([issues, response]);
		});
	}

	/**
	 * Gets all of the closed issues in a repository with a name that matches the given {@link IssueClient.repoName}.
	 * @returns The issues.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async getAllClosedIssues(): Promise<IssueModel[]> {
		return await this.getAllData<IssueModel>(async (page: number, qtyPerPage?: number) => {
			const [issues, response] = await this.getIssuesInternal(page, qtyPerPage, IssueOrPRState.closed);

			if (response.status !== GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg("An error occurred trying to get all of the closed issues.", response);
				throw new IssueError(errorMsg);
			}

			return Promise.resolve([issues, response]);
		});
	}

	/**
	 * Gets the given {@link page} of issues where the page quantity matches the given {@link qtyPerPage}, in a repository
	 * with a name that matches the given {@link IssueClient.repoName}, with the given issue {@link state},
	 * {@link labels}, and in a milestone with a number that matches the given {@link milestoneNumber}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param state The state of the issue.
	 * @param labels The labels to filter by. A null or empty list will not filter the results.
	 * @param milestoneNumber The milestone number to filter by. A null value will not filter the results.
	 * @returns A group of issues.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 * @remarks Does not require authentication if the repository is public.
	 * Open and closed issues can reside on different pages.  Example: if there are 5 open and 100 issues total, there
	 * is no guarantee that all of the opened issues will be returned if you request the first page with a quantity of 10.
	 * This is because no matter what the state of the issue is, it can reside on any page.
	 *
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 */
	public async getIssues(
		page = 1,
		qtyPerPage = 100,
		state: IssueOrPRState = IssueOrPRState.open,
		labels?: string[] | null,
		milestoneNumber?: number | null,
	): Promise<IssueModel[]> {
		page = Utils.clamp(page, 1, Number.MAX_SAFE_INTEGER);
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const [issues, response] = await this.getIssuesInternal(page, qtyPerPage, state, labels, milestoneNumber);

		// If there is an error
		if (response.status !== GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.UnprocessableContent: {
					const mainMsg = `An error occurred trying to get the issues for the repository '${super.repoName}'.`;
					const errorMsg = this.buildErrorMsg(mainMsg, response);
					throw new IssueError(errorMsg);
				}
				case GitHubHttpStatusCodes.Unauthorized:
					throw new AuthError();
				case GitHubHttpStatusCodes.NotFound: {
					const errorMsg = `The organization '${super.ownerName}' or repository '${super.repoName}' does not exist.`;
					throw new IssueError(errorMsg);
				}
			}
		}

		return issues;
	}

	/**
	 * Gets an issue with the given {@link issueNumber} from a repository with a name that matches given
	 * {@link IssueClient.repoName}.
	 * @param issueNumber The issue number.
	 * @returns The issue.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async getIssue(issueNumber: number): Promise<IssueModel> {
		Guard.isLessThanOne(issueNumber, "getIssue", "issueNumber");

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#get-an-issue
		const url = `${this.baseUrl}/repos/${super.ownerName}/${super.repoName}/issues/${issueNumber}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status !== GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.Unauthorized:
					throw new AuthError();
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.NotModified:
				case GitHubHttpStatusCodes.Gone: {
					const errorMsg = this.buildErrorMsg(`An error occurred trying to get issue '${issueNumber}'.`, response);

					throw new IssueError(errorMsg);
				}
				case GitHubHttpStatusCodes.NotFound:
					throw new IssueError(`The repository '${super.repoName}' or issue '${issueNumber}' does not exist.`);
			}
		}

		const issue = <IssueModel> await this.getResponseData(response);

		if (Utils.isIssue(issue)) {
			return issue;
		} else {
			throw new IssueError(`The repository '${super.repoName}' or issue '${issueNumber}' does not exist.`);
		}
	}

	/**
	 * Adds the given {@link label} to an issue that matches the given {@link issueNumber} in a repository
	 * with a name that matches the given {@link IssueClient.repoName}.
	 * @param issueNumber The number of an issue.
	 * @param label The name of the label to add.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 * 1. If the given {@link label} does not exist in the repository.
	 * 2. If there is an issue adding the {@link label} to an issue that matches the given {@link issueNumber}.
	 */
	public async addLabel(issueNumber: number, label: string): Promise<void> {
		Guard.isLessThanOne(issueNumber, "addLabel", "issueNumber");

		// First check that the label trying to be added exists in the repo
		const labelDoesNotExist = !(await this.labelClient.exists(label));

		if (labelDoesNotExist) {
			const labelsUrl = `https://github.com/KinsonDigital/${super.repoName}/labels`;
			const issueUrl = `https://github.com/KinsonDigital/${super.repoName}/issues/${issueNumber}`;

			let errorMsg = `The label '${label}' attempting to be added to issue '${issueNumber}'`;
			errorMsg += ` does not exist in the repository '${super.repoName}'.`;
			errorMsg += `\nRepo Labels: ${labelsUrl}`;
			errorMsg += `\nIssue: ${issueUrl}`;

			throw new IssueError(errorMsg);
		}

		const prLabels: string[] = await this.getLabels(issueNumber);
		prLabels.push(label);

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#update-an-issue
		const url = `${this.baseUrl}/repos/${super.ownerName}/${super.repoName}/issues/${issueNumber}`;

		const response: Response = await this.requestPATCH(url, JSON.stringify({ labels: prLabels }));

		// If there is an error
		if (response.status !== GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.Unauthorized:
					throw new AuthError();
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.Gone:
				case GitHubHttpStatusCodes.UnprocessableContent:
				case GitHubHttpStatusCodes.ServiceUnavailable:
				case GitHubHttpStatusCodes.Forbidden: {
					const errorMsg = this.buildErrorMsg(
						`An error occurred trying to add the label '${label}' to issue '${issueNumber}'.`,
						response,
					);
					throw new IssueError(errorMsg);
				}
				case GitHubHttpStatusCodes.NotFound:
					throw new IssueError(`An issue with the number '${issueNumber}' does not exist.`);
			}
		}
	}

	/**
	 * Gets all of the labels for an issue that matches the given {@link issueNumber} in a repository
	 * with a name that matches the given {@link IssueClient.repoName}.
	 * @param issueNumber The number of an issue.
	 * @returns The labels for an issue.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async getLabels(issueNumber: number): Promise<string[]> {
		Guard.isLessThanOne(issueNumber, "getLabels", "issueNumber");

		const url = `${this.baseUrl}/repos/${super.ownerName}/${super.repoName}/issues/${issueNumber}/labels`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status !== GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.Unauthorized:
					throw new AuthError();
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.Gone: {
					const errorMsg = this.buildErrorMsg(
						`There was an issue getting the labels for issue '${issueNumber}'.`,
						response,
					);

					throw new IssueError(errorMsg);
				}
				case GitHubHttpStatusCodes.NotFound:
					throw new IssueError(`An issue with the number '${issueNumber}' does not exist.`);
			}
		}

		const responseData = <LabelModel[]> await this.getResponseData(response);

		return responseData.map((label: LabelModel) => label.name);
	}

	/**
	 * Returns a value indicating whether or not an issue with the given {@link issueNumber} exists regardless
	 * of its state, in a repository with a name that matches the given {@link IssueClient.repoName}.
	 * @param issueNumber The issue number.
	 * @returns True if the issue exists, otherwise false.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async issueExists(issueNumber: number): Promise<boolean> {
		Guard.isLessThanOne(issueNumber, "issueExists", "issueNumber");

		return await this.openOrClosedIssueExists(issueNumber, IssueOrPRState.any);
	}

	/**
	 * Returns a value indicating whether or not an open issue with the given {@link issueNumber} exists in a
	 * repository with a name that matches the given {@link IssueClient.repoName}.
	 * @param issueNumber The issue number.
	 * @returns True if the issue exists and is open, otherwise false.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async openExists(issueNumber: number): Promise<boolean> {
		Guard.isLessThanOne(issueNumber, "openIssueExist", "issueNumber");

		return await this.openOrClosedIssueExists(issueNumber, IssueOrPRState.open);
	}

	/**
	 * Returns a value indicating whether or not a closed issue with the given {@link issueNumber} exists in a
	 * repository with a name that matches the given {@link IssueClient.repoName}.
	 * @param issueNumber The issue number.
	 * @returns True if the issue exists and is open, otherwise false.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async closedExists(issueNumber: number): Promise<boolean> {
		Guard.isLessThanOne(issueNumber, "closedIssueExist", "issueNumber");

		return await this.openOrClosedIssueExists(issueNumber, IssueOrPRState.closed);
	}

	/**
	 * Updates an issue with the given {@link issueNumber} and {@link issueData}, in a repository with a name
	 * that matches the given {@link IssueClient.repoName}.
	 * @param issueNumber The issue number.
	 * @param issueData The data to update the issue with.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	public async updateIssue(issueNumber: number, issueData: IssueOrPRRequestData): Promise<void> {
		Guard.isLessThanOne(issueNumber, "updateIssue", "issueNumber");

		const url = `${this.baseUrl}/repos/${super.ownerName}/${super.repoName}/issues/${issueNumber}`;

		const issueBody: string = JSON.stringify(issueData);
		const response = await this.requestPATCH(url, issueBody);

		if (response.status !== GitHubHttpStatusCodes.OK) {
			if (response.status === GitHubHttpStatusCodes.NotFound) {
				throw new IssueError(`An issue with the number '${issueNumber}' does not exist.`);
			} else {
				switch (response.status) {
					case GitHubHttpStatusCodes.Unauthorized:
						throw new AuthError();
					case GitHubHttpStatusCodes.MovedPermanently:
					case GitHubHttpStatusCodes.Gone:
					case GitHubHttpStatusCodes.UnprocessableContent:
					case GitHubHttpStatusCodes.ServiceUnavailable:
					case GitHubHttpStatusCodes.Forbidden: {
						const errorMsg = this.buildErrorMsg(
							`An error occurred trying to update issue '${issueNumber}'.`,
							response,
						);

						throw new IssueError(errorMsg);
					}
				}
			}
		}
	}

	/**
	 * Checks if an issue with the given {@link issueNumber } exists with the given {@link state} in a
	 * repository with a name that matches the given {@link IssueClient.repoName}.
	 * @param issueNumber The number of the issue.
	 * @returns True if the issue exists, otherwise false.
	 * @throws The {@link IssueError} if an error occurs while checking if the open or closed issue exists.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 */
	private async openOrClosedIssueExists(issueNumber: number, state: IssueOrPRState): Promise<boolean> {
		Guard.isLessThanOne(issueNumber, "openOrClosedIssueExists", "issueNumber");

		const issues = await this.getAllDataUntil<IssueModel>(
			async (page: number, qtyPerPage?: number) => {
				const [issues, response] = await this.getIssuesInternal(page, qtyPerPage, state);

				return Promise.resolve([issues, response]);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: IssueModel[]) => {
				return pageOfData.some((issue: IssueModel) => issue.number === issueNumber);
			},
		);

		return issues.find((issue: IssueModel) => issue.number === issueNumber) !== undefined;
	}

	/**
	 * Gets the given {@link page} of issues where the page quantity matches the given {@link qtyPerPage}, in a repository
	 * with a name that matches the given {@link IssueClient.repoName}, with the given issue {@link state},
	 * {@link labels}, and in a milestone with a number that matches the given {@link milestoneNumber}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param state The state of the issue.
	 * @param labels The labels to filter by. A null or empty list will not filter the results.
	 * @param milestoneNumber The milestone number to filter by. A null value will not filter the results.
	 * @returns A group of issues.
	 * @throws An {@link AuthError} or {@link IssueError}.
	 * @remarks Does not require authentication if the repository is public.
	 * Open and closed issues can reside on different pages.  Example: if there are 5 open and 100 issues total, there
	 * is no guarantee that all of the opened issues will be returned if you request the first page with a quantity of 10.
	 * This is because no matter what the state of the issue is, it can reside on any page.
	 *
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 */
	private async getIssuesInternal(
		page = 1,
		qtyPerPage = 100,
		state: IssueOrPRState = IssueOrPRState.open,
		labels?: string[] | null,
		milestoneNumber?: number | null,
	): Promise<[IssueModel[], Response]> {
		page = Utils.clamp(page, 1, Number.MAX_SAFE_INTEGER);
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues
		const labelList = labels?.filter((l) => !Utils.isNothing(l)).map((l) => l.trim()).join(",") ?? "";

		const milestoneNumberQueryParam = Utils.isNothing(milestoneNumber) ? "" : `&milestone=${milestoneNumber}`;
		const labelListQueryParam = labelList.length > 0 ? `&labels=${labelList}` : "";

		const queryParams =
			`?page=${page}&per_page=${qtyPerPage}&state=${state}${labelListQueryParam}${milestoneNumberQueryParam}`;
		const url = `${this.baseUrl}/repos/${super.ownerName}/${super.repoName}/issues${queryParams}`;

		const response: Response = await this.requestGET(url);

		const issues = (<IssueModel[]> await this.getResponseData(response)).filter((issue) => Utils.isIssue(issue));

		return [issues, response];
	}
}
