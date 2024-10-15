import { Guard } from "../core/Guard.ts";
import { LabelClient } from "./LabelClient.ts";
import { AuthError } from "../deps.ts";
import { Utils } from "../deps.ts";
import { GitHubHttpStatusCodes, IssueOrPRState, MergeState } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { PullRequestError } from "../deps.ts";
import type { PullRequestModel } from "../deps.ts";
import type { IssueOrPRRequestData } from "../core/IssueOrPRRequestData.ts";

/**
 * Provides a client for interacting with pull requests.
 */
export class PullRequestClient extends GitHubClient {
	private readonly labelClient: LabelClient;

	/**
	 * Initializes a new instance of the {@link PullRequestClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 * @throws An {@link Error} if the parameters are undefined, null, or empty.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "PullRequestClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);
		this.labelClient = new LabelClient(ownerName, repoName, token);
	}

	/**
	 * Gets all of the open pull requests for a repository with a name that matches
	 * the given{@link PullRequestClient}.{@link repoName}.
	 * @returns The pull request.
	 * @remarks Does not require authentication.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async getAllOpenPullRequests(): Promise<PullRequestModel[]> {
		return await this.getAllData<PullRequestModel>(async (page, qtyPerPage) => {
			const [prs, response] = await this.getPullRequestsInternal(page, qtyPerPage, IssueOrPRState.open);

			this.processPossibleErrors(response);

			return [prs, response];
		});
	}

	/**
	 * Gets all of the closed pull requests for a repository with a name that matches the
	 * given {@link PullRequestClient}.{@link repoName}.
	 * @returns The pull request.
	 * @remarks Does not require authentication.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async getAllClosedPullRequests(): Promise<PullRequestModel[]> {
		return await this.getAllData<PullRequestModel>(async (page, qtyPerPage) => {
			const [prs, response] = await this.getPullRequestsInternal(page, qtyPerPage, IssueOrPRState.closed);

			this.processPossibleErrors(response);

			return [prs, response];
		});
	}

	/**
	 * Gets a {@link page} of pull requests where the quantity for each page matches the given {@link qtyPerPage},
	 * where the pull request has the given {@link state} and {@link labels}, for a repository with a name that matches the
	 * given {@link PullRequestClient}.{@link repoName}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param state The state of the pull request.
	 * @param labels The labels to filter by. A null or empty list will not filter the results.
	 * @returns A group of pull requests.
	 * @remarks Does not require authentication if the repository is public.
	 * Open and closed pull requests can reside on different pages.  Example: if there are 5 open and 100 pull requests total, there
	 * is no guarantee that all of the opened pull requests will be returned if you request the first page with a quantity of 10.
	 * This is because no matter what the state of the pull request is, it can reside on any page.
	 *
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value of 100 will be used.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async getPullRequests(
		page = 1,
		qtyPerPage = 100,
		state: IssueOrPRState = IssueOrPRState.open,
		mergeState: MergeState = MergeState.any,
		labels?: string[] | null,
		milestoneNumber?: number,
	): Promise<PullRequestModel[]> {
		Guard.isLessThanOne(page, "getPullRequests", "page");

		page = Utils.clamp(page, 1, Number.MAX_SAFE_INTEGER);
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const [prs, response] = await this.getPullRequestsInternal(page, qtyPerPage, state, mergeState, labels, milestoneNumber);

		this.processPossibleErrors(response);

		return prs;
	}

	/**
	 * Gets all of the labels for a pull request with a number that matches the given {@link prNumber}, in a repository
	 * with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param this.repoName The name of the repo.
	 * @param prNumber The number of the pull request.
	 * @returns The labels for the pull request.
	 * @remarks Does not require authentication.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async getLabels(prNumber: number): Promise<string[]> {
		Guard.isLessThanOne(prNumber, "getLabels", "prNumber");

		return (await this.getPullRequest(prNumber)).labels?.map((label) => label.name) ?? [];
	}

	/**
	 * Gets a pull request with a number that matches the given {@link prNumber} in a repository with a name
	 * that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The number of the pull request.
	 * @returns The pull request.
	 * @remarks Does not require authentication.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async getPullRequest(prNumber: number): Promise<PullRequestModel> {
		Guard.isLessThanOne(prNumber, "getPullRequest", "prNumber");

		// REST API Docs: https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#get-a-pull-request
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/pulls/${prNumber}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status !== GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.Unauthorized:
					throw new AuthError();
				case GitHubHttpStatusCodes.NotModified:
				case GitHubHttpStatusCodes.Gone:
				case GitHubHttpStatusCodes.InternalServerError: {
					let errorMsg = `An error occurred trying to get the pull request '${prNumber}'.`;
					errorMsg += `\n\tError '${response.status}(${response.statusText})'`;
					throw new PullRequestError(errorMsg);
				}
				case GitHubHttpStatusCodes.NotFound:
					throw new PullRequestError(`The pull request number '${prNumber}' does not exist.`);
			}
		}

		return <PullRequestModel> await this.getResponseData(response);
	}

	/**
	 * Adds the given {@link label} to a pull request with a number that matches the given {@link prNumber},
	 * in a repository with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The number of the pull request.
	 * @param label The name of the label to add.
	 * @remarks Requires authentication.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async addLabel(prNumber: number, label: string): Promise<void> {
		Guard.isLessThanOne(prNumber, "addLabel", "prNumber");
		Guard.isNothing(label, "addLabel", "label");

		if (!this.containsToken()) {
			throw new PullRequestError(`The request to add label '${label}' is forbidden.  Check the auth token.`);
		}

		// First check that the label trying to be added exists in the repo
		const labelDoesNotExist = !(await this.labelClient.exists(label));

		if (labelDoesNotExist) {
			const labelsUrl = Utils.buildLabelsUrl(this.ownerName, this.repoName);
			const prUrl = Utils.buildPullRequestUrl(this.ownerName, this.repoName, prNumber);
			let errorMsg = `Could not add the label '${label}' to pull request '${prNumber}'.`;
			errorMsg = `The label '${label}' does not exist in the repo '${this.repoName}'.`;
			errorMsg += `\nRepo Labels: ${labelsUrl}`;
			errorMsg += `\nPull Request: ${prUrl}`;

			throw new PullRequestError(errorMsg);
		}

		const prLabels: string[] = await this.getLabels(prNumber);
		prLabels.push(label);

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#update-an-issue
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${prNumber}`;
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
						`An error occurred trying to add the label '${label}' to pull request '${prNumber}'.`,
						response,
					);

					throw new PullRequestError(errorMsg);
				}
				case GitHubHttpStatusCodes.NotFound:
					throw new PullRequestError(`The pull request number '${prNumber}' does not exist.`);
			}
		}
	}

	/**
	 * Checks if a pull request with the given {@link prNumber } exists in a repository with a name that matches
	 * the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The number of the pull request.
	 * @returns True if the pull request exists, otherwise false.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async exists(prNumber: number): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "pullRequestExists", "prNumber");

		// REST API Docs: https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/pulls/${prNumber}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status !== GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.Unauthorized:
					throw new AuthError();
				case GitHubHttpStatusCodes.NotModified:
				case GitHubHttpStatusCodes.InternalServerError:
				case GitHubHttpStatusCodes.ServiceUnavailable: {
					const errorMsg = this.buildErrorMsg(
						`An error occurred checking if pull request '${prNumber}' exists.`,
						response,
					);

					throw new PullRequestError(errorMsg);
				}
				case GitHubHttpStatusCodes.NotFound:
					return false;
			}
		}

		return true;
	}

	/**
	 * Returns a value indicating whether or not an open pull request with the given {@link prNumber} exists in a repository
	 * that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The pull request number.
	 * @returns True if the pull request exists and is open, otherwise false.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async openExists(prNumber: number): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "openPullRequestExists", "issueNumber");

		return await this.openOrClosedExists(prNumber, IssueOrPRState.open);
	}

	/**
	 * Updates a pull request with a number that matches the given {@link prNumber}, using the given {@link prRequestData},
	 * in a repository with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The pull request number.
	 * @param prRequestData The data to update the pull request with.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async updatePullRequest(prNumber: number, prRequestData: IssueOrPRRequestData): Promise<void> {
		Guard.isLessThanOne(prNumber, "updatePullRequest", "prNumber");

		const prDoesNotExist = !(await this.exists(prNumber));

		if (prDoesNotExist) {
			const errorMsg = `A pull request with the number '${prNumber}' does not exist in the repo '${this.repoName}'.`;
			throw new PullRequestError(errorMsg);
		}

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${prNumber}`;

		const prBody: string = JSON.stringify(prRequestData);
		const response = await this.requestPATCH(url, prBody);

		if (response.status !== GitHubHttpStatusCodes.OK) {
			if (response.status === GitHubHttpStatusCodes.NotFound) {
				throw new PullRequestError(`An pull request with the number '${prNumber}' does not exist.`);
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
							`An error occurred trying to update pull request '${prNumber}'.`,
							response,
						);

						throw new PullRequestError(errorMsg);
					}
				}
			}
		}
	}

	/**
	 * Requests a review from a reviewer with a GitHub login name that matches the given {@link reviewers},
	 * for a pull request that matches the given {@link prNumber} in a repository where the name matches
	 * the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The pull request number.
	 * @param reviewers The reviewer to request.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async requestReviewers(prNumber: number, reviewers: string | string[]): Promise<void> {
		const funcName = "requestReviewers";
		Guard.isLessThanOne(prNumber, funcName, "prNumber");
		Guard.isNothing(reviewers, funcName, "reviewers");

		const reviewersToAdd: string[] = [];

		if (typeof reviewers === "string") {
			reviewersToAdd.push(reviewers.trim());
		} else if (Array.isArray(reviewers)) {
			// Trim all of the items
			for (let i = 0; i < reviewers.length; i++) {
				const reviewer = reviewers[i];
				reviewersToAdd.push(reviewer.trim());
			}
		}

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/pulls/${prNumber}/requested_reviewers`;
		const body = JSON.stringify({ reviewers: reviewersToAdd });

		const response = await this.requestPOST(url, body);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== GitHubHttpStatusCodes.Created) {
			const errorMsg = this.buildErrorMsg(
				`An error occurred trying to request the reviewer '${reviewers}' for pull request '${prNumber}'.` +
					`\n\t'PR: ${Utils.buildPullRequestUrl(this.ownerName, this.repoName, prNumber)}'`,
				response,
			);

			throw new PullRequestError(errorMsg);
		}
	}

	/**
	 * Returns a value indicating whether or not a closed pull request with the given {@link prNumber} exists in a repository
	 * that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The pull request number.
	 * @returns True if the pull request exists and is open, otherwise false.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async closedExists(prNumber: number): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "closedPullRequestExists", "issueNumber");

		return await this.openOrClosedExists(prNumber, IssueOrPRState.closed);
	}

	/**
	 * Creates a new pull request in a repository with a name that matches the given {@link PullRequestClient}.{@link repoName},
	 * using the given {@link title}, {@link headBranch}, {@link baseBranch}, and {@link description}.
	 * @param title The title of the pull request.
	 * @param headBranch The name of the branch that contains the changes for the pull request.
	 * @param baseBranch The name of the branch that the changes will be pulled into.
	 * @param description The description of the pull request.
	 * @param maintainerCanModify The value indicating whether or not maintainers can modify the pull request.
	 * @param isDraft The value indicating whether or not the pull request is a draft pull request.
	 * @returns The newly created pull request.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	public async createPullRequest(
		title: string,
		headBranch: string,
		baseBranch: string,
		description = "",
		maintainerCanModify = true,
		isDraft = true,
	): Promise<PullRequestModel> {
		const funcName = "createPullRequest";
		Guard.isNothing(title, funcName, "title");
		Guard.isNothing(headBranch, funcName, "headBranch");
		Guard.isNothing(baseBranch, funcName, "baseBranch");

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/pulls`;
		const body = {
			owner: `${this.ownerName}`,
			repo: `${this.repoName}`,
			title: title,
			head: headBranch,
			base: baseBranch,
			body: description,
			maintainer_can_modify: maintainerCanModify,
			draft: isDraft,
		};

		const response = await this.requestPOST(url, JSON.stringify(body));

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== GitHubHttpStatusCodes.Created) {
			const errorMsg = this.buildErrorMsg("There was an issue creating the pull request.", response);

			throw new PullRequestError(errorMsg);
		}

		const newPullRequest = await response.json() as PullRequestModel;

		return newPullRequest;
	}

	/**
	 * Checks if a pull request with the given {@link prNumber } exists with the given {@link state} in a
	 * repository with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The number of the issue.
	 * @returns True if the pull request exists, otherwise false.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	private async openOrClosedExists(
		prNumber: number,
		state: IssueOrPRState,
	): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "openOrClosedPullRequestExists", "prNumber");

		const issues = await this.getAllDataUntil<PullRequestModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getPullRequestsInternal(page, qtyPerPage, state);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: PullRequestModel[]) => {
				return pageOfData.some((issue: PullRequestModel) => issue.number === prNumber);
			},
		);

		return issues.find((issue: PullRequestModel) => issue.number === prNumber) !== undefined;
	}

	/**
	 * Gets a {@link page} of pull requests where the quantity for each page matches the given {@link qtyPerPage},
	 * where the pull request has the given {@link state} and {@link labels}, for a repository with a name that matches the
	 * given {@link PullRequestClient}.{@link repoName}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param state The state of the pull request.
	 * @param labels The labels to filter by. A null or empty list will not filter the results.
	 * @returns A group of pull requests.
	 * @remarks Does not require authentication if the repository is public.
	 * Open and closed pull requests can reside on different pages.  Example: if there are 5 open and 100 pull requests total, there
	 * is no guarantee that all of the opened pull requests will be returned if you request the first page with a quantity of 10.
	 * This is because no matter what the state of the pull request is, it can reside on any page.
	 *
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value of 100 will be used.
	 * @throws Throws the following errors:
	 * 1. The {@link AuthError} when the request is unauthorized.
	 * 2. The {@link PullRequestError} when something goes wrong with getting all of the pull requests.
	 */
	private async getPullRequestsInternal(
		page = 1,
		qtyPerPage = 100,
		state: IssueOrPRState = IssueOrPRState.open,
		mergeState: MergeState = MergeState.any,
		labels?: string[] | null,
		milestoneNumber?: number,
	): Promise<[PullRequestModel[], Response]> {
		Guard.isLessThanOne(page, "getPullRequests", "page");

		page = Utils.clamp(page, 1, Number.MAX_SAFE_INTEGER);
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues

		const labelList = Utils.isNothing(labels)
			? labels?.filter((l) => Utils.isNothing(l)).map((l) => l.trim()).join(",") ?? ""
			: "";

		const milestoneNumberQueryParam = Utils.isNothing(milestoneNumber) ? "" : `&milestone=${milestoneNumber}`;
		const labelListQueryParam = labelList.length > 0 ? `&labels=${labelList}` : "";

		const queryParams =
			`?page=${page}&per_page=${qtyPerPage}&state=${state}${labelListQueryParam}${milestoneNumberQueryParam}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues${queryParams}`;

		const response: Response = await this.requestGET(url);

		// Get all of the pull requests that are with any merge state
		const allPullRequests = (<PullRequestModel[]> await this.getResponseData(response))
			.filter((pr) => Utils.isPr(pr));

		const filteredResults = allPullRequests.filter((pr) => {
			switch (mergeState) {
				case MergeState.any:
					return true;
				case MergeState.unmerged:
					return pr.pull_request?.merged_at === null;
				case MergeState.merged:
					return pr.pull_request?.merged_at !== null;
				default:
					break;
			}
		});

		return [filteredResults, response];
	}

	/**
	 * Processes any possible errors from the given {@link response}.
	 * @param response The response from a request.
	 */
	private processPossibleErrors(response: Response): void {
		if (response.status !== GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.Unauthorized:
					throw new AuthError();
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.UnprocessableContent: {
					const errorMsg = this.buildErrorMsg(
						`An error occurred trying to get the pull requests for the repository '${this.repoName}'.`,
						response,
					);

					throw new PullRequestError(errorMsg);
				}
				case GitHubHttpStatusCodes.NotFound: {
					const errorMsg = `The organization '${this.ownerName}' or repository '${this.repoName}' does not exist.`;
					throw new PullRequestError(errorMsg);
				}
			}
		}
	}
}
