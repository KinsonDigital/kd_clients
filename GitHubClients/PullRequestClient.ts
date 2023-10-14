import { Guard } from "../core/Guard.ts";
import { LabelClient } from "./LabelClient.ts";
import { PullRequestModel } from "../core/Models/PullRequestModel.ts";
import { Utils } from "../core/Utils.ts";
import { GitHubHttpStatusCodes, IssueOrPRState, MergeState } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { IssueOrPRRequestData } from "../core/IssueOrPRRequestData.ts";

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
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "TagClient.ctor";
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
	 */
	public async getAllOpenPullRequests(): Promise<PullRequestModel[]> {
		return await this.getAllData<PullRequestModel>(async (page, qtyPerPage) => {
			return await this.getPullRequests(page, qtyPerPage, IssueOrPRState.open);
		});
	}

	/**
	 * Gets all of the closed pull requests for a repository with a name that matches the
	 * given {@link PullRequestClient}.{@link repoName}.
	 * @returns The pull request.
	 * @remarks Does not require authentication.
	 */
	public async getAllClosedPullRequests(): Promise<PullRequestModel[]> {
		return await this.getAllData<PullRequestModel>(async (page, qtyPerPage) => {
			return await this.getPullRequests(page, qtyPerPage, IssueOrPRState.closed);
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
	 * @returns The issue.
	 * @remarks Does not require authentication if the repository is public.
	 * Open and closed pull requests can reside on different pages.  Example: if there are 5 open and 100 pull requests total, there
	 * is no guarantee that all of the opened pull requests will be returned if you request the first page with a quantity of 10.
	 * This is because no matter what the state of the pull request is, it can reside on any page.
	 *
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value of 100 will be used.
	 */
	public async getPullRequests(
		page = 1,
		qtyPerPage = 100,
		state: IssueOrPRState = IssueOrPRState.open,
		mergeState: MergeState = MergeState.any,
		labels?: string[] | null,
		milestoneNumber?: number,
	): Promise<[PullRequestModel[], Response]> {
		const functionName = "getPullRequests";
		Guard.isLessThanOne(page, functionName, "page");

		this.repoName = this.repoName.trim();
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

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.UnprocessableContent:
				case GitHubHttpStatusCodes.Unauthorized: {
					let errorMsg = `An error occurred trying to get the pull requests for the repository '${this.repoName}'.`;
					errorMsg += `\n\tError: ${response.status}(${response.statusText})`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
				case GitHubHttpStatusCodes.NotFound: {
					const errorMsg = `The organization '${this.ownerName}' or repository '${this.repoName}' does not exist.`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
			}

			Deno.exit(1);
		}

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
					return pr.pull_request?.merged_at != null;
				default:
					break;
			}
		});

		return [filteredResults, response];
	}

	/**
	 * Gets all of the labels for a pull request with a number that matches the given {@link prNumber}, in a repository
	 * with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param this.repoName The name of the repo.
	 * @param prNumber The number of the pull request.
	 * @returns The labels for the pull request.
	 * @remarks Does not require authentication.
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
	 */
	public async getPullRequest(prNumber: number): Promise<PullRequestModel> {
		Guard.isLessThanOne(prNumber, "getPullRequest", "prNumber");

		// REST API Docs: https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#get-a-pull-request
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/pulls/${prNumber}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.NotModified:
				case GitHubHttpStatusCodes.InternalServerError:
				case GitHubHttpStatusCodes.ServiceUnavailable:
				case GitHubHttpStatusCodes.Unauthorized: {
					let errorMsg = `An error occurred trying to get the pull request '${prNumber}'.`;
					errorMsg += `\n\tError '${response.status}(${response.statusText})'`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
				case GitHubHttpStatusCodes.NotFound:
					Utils.printAsGitHubError(`The pull request number '${prNumber}' does not exist.`);
					break;
			}

			Deno.exit(1);
		}

		return <PullRequestModel> await this.getResponseData(response);
	}

	/**
	 * Adds the given {@link label} to a pull request with a number that matches the given {@link prNumber},
	 * in a repository with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The number of the pull request.
	 * @param label The name of the label to add.
	 * @remarks Requires authentication.
	 */
	public async addLabel(prNumber: number, label: string): Promise<void> {
		Guard.isLessThanOne(prNumber, "addLabel", "prNumber");
		Guard.isNothing(label, "addLabel", "label");

		if (!this.containsToken()) {
			Utils.printAsGitHubError(`The request to add label '${label}' is forbidden.  Check the auth token.`);
			Deno.exit(1);
		}

		// First check that the label trying to be added exists in the repo
		const labelDoesNotExist = !(await this.labelClient.labelExists(label));

		if (labelDoesNotExist) {
			const labelsUrl = Utils.buildLabelsUrl(this.ownerName, this.repoName);
			const prUrl = Utils.buildPullRequestUrl(this.ownerName, this.repoName, prNumber);
			let errorMsg = `Could not add the label '${label}' to pull request '${prNumber}'.`;
			errorMsg = `The label '${label}' does not exist in the repo '${this.repoName}'.`;
			errorMsg += `\nRepo Labels: ${labelsUrl}`;
			errorMsg += `\nPull Request: ${prUrl}`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		const prLabels: string[] = await this.getLabels(prNumber);
		prLabels.push(label);

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#update-an-issue
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${prNumber}`;
		const response: Response = await this.requestPATCH(url, JSON.stringify({ labels: prLabels }));

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.Gone:
				case GitHubHttpStatusCodes.UnprocessableContent:
				case GitHubHttpStatusCodes.ServiceUnavailable:
				case GitHubHttpStatusCodes.Forbidden:
				case GitHubHttpStatusCodes.Unauthorized: {
					let errorMsg = `An error occurred trying to add the label '${label}' to pull request '${prNumber}'.`;
					errorMsg += `\n\tError: ${response.status}(${response.statusText})`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
				case GitHubHttpStatusCodes.NotFound:
					Utils.printAsGitHubError(`The pull request number '${prNumber}' does not exist.`);
					break;
			}

			Deno.exit(1);
		}
	}

	/**
	 * Checks if a pull request with the given {@link prNumber } exists in a repository with a name that matches
	 * the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The number of the pull request.
	 * @returns True if the pull request exists, otherwise false.
	 */
	public async pullRequestExists(prNumber: number): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "pullRequestExists", "prNumber");

		// REST API Docs: https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#list-pull-requests
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/pulls/${prNumber}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.NotModified:
				case GitHubHttpStatusCodes.InternalServerError:
				case GitHubHttpStatusCodes.ServiceUnavailable:
				case GitHubHttpStatusCodes.Unauthorized: {
					let errorMsg = `An error occurred checking if pull request '${prNumber}' exists.`;
					errorMsg = `\n\tError: ${response.status}(${response.statusText})`;
					Utils.printAsGitHubError(errorMsg);
					break;
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
	 */
	public async openPullRequestExists(prNumber: number): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "openPullRequestExists", "issueNumber");

		return await this.openOrClosedPullRequestExists(prNumber, IssueOrPRState.open);
	}

	/**
	 * Updates a pull request with a number that matches the given {@link prNumber}, using the given {@link prRequestData},
	 * in a repository with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The pull request number.
	 * @param prRequestData The data to update the pull request with.
	 */
	public async updatePullRequest(prNumber: number, prRequestData: IssueOrPRRequestData): Promise<void> {
		Guard.isLessThanOne(prNumber, "updatePullRequest", "prNumber");

		const prDoesNotExist = !(await this.pullRequestExists(prNumber));

		if (prDoesNotExist) {
			Utils.printAsGitHubError(`A pull request with the number '${prNumber}' does not exist in the repo '${this.repoName}'.`);
			Deno.exit(1);
		}

		this.repoName = this.repoName.trim();

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${prNumber}`;

		const prBody: string = JSON.stringify(prRequestData);
		const response = await this.requestPATCH(url, prBody);

		if (response.status != GitHubHttpStatusCodes.OK) {
			if (response.status === GitHubHttpStatusCodes.NotFound) {
				Utils.printAsGitHubError(`An pull request with the number '${prNumber}' does not exist.`);
			} else {
				switch (response.status) {
					case GitHubHttpStatusCodes.MovedPermanently:
					case GitHubHttpStatusCodes.Gone:
					case GitHubHttpStatusCodes.UnprocessableContent:
					case GitHubHttpStatusCodes.ServiceUnavailable:
					case GitHubHttpStatusCodes.Forbidden:
					case GitHubHttpStatusCodes.Unauthorized: {
						let errorMsg = `An error occurred trying to update pull request '${prNumber}'.`;
						errorMsg += `\n\t'Error: ${response.status}(${response.statusText})`;

						Utils.printAsGitHubError(errorMsg);
						break;
					}
				}
			}

			Deno.exit(1);
		}
	}

	/**
	 * Requests a review from a reviewer with a GitHub login name that matches the given {@link reviewer},
	 * for a pull request that matches the given {@link prNumber} in a repository where the name matches
	 * the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The pull request number.
	 * @param reviewer The reviewer to request.
	 */
	public async requestReviewer(prNumber: number, reviewer: string): Promise<void> {
		Guard.isLessThanOne(prNumber, "requestReviewer", "prNumber");
		Guard.isNothing(reviewer, "requestReviewer", "reviewer");

		this.repoName = this.repoName.trim();
		reviewer = reviewer.trim();

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/pulls/${prNumber}/requested_reviewers`;
		const body = JSON.stringify({ reviewers: [reviewer] });

		const response = await this.requestPOST(url, body);

		if (response.status != GitHubHttpStatusCodes.Created) {
			let errorMsg = `An error occurred trying to request the reviewer '${reviewer}' for pull request '${prNumber}'.`;
			errorMsg += `\n\t'Error: ${response.status}(${response.statusText})`;
			errorMsg += `\n\t'PR: ${Utils.buildPullRequestUrl(this.ownerName, this.repoName, prNumber)}'`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Returns a value indicating whether or not a closed pull request with the given {@link prNumber} exists in a repository
	 * that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The pull request number.
	 * @returns True if the pull request exists and is open, otherwise false.
	 */
	public async closedPullRequestExists(prNumber: number): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "closedPullRequestExists", "issueNumber");

		return await this.openOrClosedPullRequestExists(prNumber, IssueOrPRState.closed);
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

		if (response.status != GitHubHttpStatusCodes.Created) {
			const errorMsg = `Error: ${response.status}(${response.statusText})`;
			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		const newPullRequest = await response.json() as PullRequestModel;

		return newPullRequest;
	}

	/**
	 * Checks if a pull request with the given {@link prNumber } exists with the given {@link state} in a
	 * repository with a name that matches the given {@link PullRequestClient}.{@link repoName}.
	 * @param prNumber The number of the issue.
	 * @returns True if the pull request exists, otherwise false.
	 */
	private async openOrClosedPullRequestExists(
		prNumber: number,
		state: IssueOrPRState,
	): Promise<boolean> {
		Guard.isLessThanOne(prNumber, "openOrClosedPullRequestExists", "issueNumber");

		const issues = await this.getAllDataUntil<PullRequestModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getPullRequests(page, qtyPerPage, state);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: PullRequestModel[]) => {
				return pageOfData.some((issue: PullRequestModel) => issue.number === prNumber);
			},
		);

		return issues.find((issue: PullRequestModel) => issue.number === prNumber) != undefined;
	}
}
