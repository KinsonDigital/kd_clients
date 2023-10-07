import { Guard } from "core/Guard.ts";
import { LabelClient } from "github/LabelClient.ts";
import { IssueModel } from "models/IssueModel.ts";
import { LabelModel } from "models/LabelModel.ts";
import { Utils } from "core/Utils.ts";
import { GitHubHttpStatusCodes, IssueOrPRState } from "core/Enums.ts";
import { GitHubClient } from "core/GitHubClient.ts";
import { IssueOrPRRequestData } from "core/IssueOrPRRequestData.ts";

/**
 * Provides a client for interacting with issues.
 */
export class IssueClient extends GitHubClient {
	private readonly labelClient: LabelClient;

	/**
	 * Initializes a new instance of the {@link IssueClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		super(ownerName, repoName, token);
		this.labelClient = new LabelClient(ownerName, repoName, token);
	}

	/**
	 * Gets all of the open issues in a repository with a name that matches the given {@link IssueClient}.{@link this.this.repoName}.
	 * @returns The issues.
	 * @remarks Does not require authentication.
	 */
	public async getAllOpenIssues(): Promise<IssueModel[]> {
		Guard.isNullOrEmptyOrUndefined(this.repoName, "getAllOpenIssues", "this.repoName");

		return await this.getAllData<IssueModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getIssues(page, qtyPerPage);
		});
	}

	/**
	 * Gets all of the closed issues in a repository with a name that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @returns The issues.
	 * @remarks Does not require authentication.
	 */
	public async getAllClosedIssues(): Promise<IssueModel[]> {
		Guard.isNullOrEmptyOrUndefined(this.repoName, "getAllClosedIssues", "this.repoName");

		return await this.getAllData<IssueModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getIssues(page, qtyPerPage, IssueOrPRState.closed);
		});
	}

	/**
	 * Gets the given {@link page} of issues where the page quantity matches the given {@link qtyPerPage}, in a repository
	 * with a name that matches the given {@link IssueClient}.{@link this.repoName}, with the given issue {@link state},
	 * {@link labels}, and in a milestone with a number that matches the given {@link milestoneNumber}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param state The state of the issue.
	 * @param labels The labels to filter by. A null or empty list will not filter the results.
	 * @param milestoneNumber The milestone number to filter by. A null value will not filter the results.
	 * @returns The issue.
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
	): Promise<[IssueModel[], Response]> {
		const functionName = "getIssues";
		Guard.isNullOrEmptyOrUndefined(this.repoName, functionName, "this.repoName");

		this.repoName = this.repoName.trim();
		page = Utils.clamp(page, 1, Number.MAX_SAFE_INTEGER);
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#list-repository-issues
		const labelList = Utils.isNullOrEmptyOrUndefined(labels)
			? labels?.filter((l) => Utils.isNullOrEmptyOrUndefined(l)).map((l) => l.trim()).join(",") ?? ""
			: "";

		const milestoneNumberQueryParam = Utils.isNullOrEmptyOrUndefined(milestoneNumber) ? "" : `&milestone=${milestoneNumber}`;
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
					let errorMsg = `An error occurred trying to get the issues for the repository '${this.repoName}'.`;
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

		const issues = (<IssueModel[]> await this.getResponseData(response)).filter((issue) => Utils.isIssue(issue));

		return [issues, response];
	}

	/**
	 * Gets an issue with the given {@link issueNumber} from a repository with a name that matches given
	 * {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The issue number.
	 * @returns The issue.
	 */
	public async getIssue(issueNumber: number): Promise<IssueModel> {
		Guard.isNullOrEmptyOrUndefined(this.repoName, "getIssue", "this.repoName");
		Guard.isLessThanOne(issueNumber, "getIssue", "issueNumber");

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#get-an-issue
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${issueNumber}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.NotModified:
				case GitHubHttpStatusCodes.Unauthorized:
				case GitHubHttpStatusCodes.Gone: {
					let errorMsg = `An error occurred trying to get issue '${issueNumber}'.`;
					errorMsg += `\n\tError: ${response.status}(${response.statusText})`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
				case GitHubHttpStatusCodes.NotFound:
					Utils.printAsGitHubError(`The repository '${this.repoName}' or issue '${issueNumber}' does not exist.`);
					break;
			}

			Deno.exit(1);
		}

		const issue = <IssueModel> await this.getResponseData(response);

		if (Utils.isIssue(issue)) {
			return issue;
		} else {
			const errorMsg = `The issue '${issueNumber}' in the repository '${this.repoName}' is not an issue.`;
			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}
	}

	/**
	 * Adds the given {@link label} to an issue that matches the given {@link issueNumber} in a repository
	 * with a name that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The number of an issue.
	 * @param label The name of the label to add.
	 * @remarks Requires authentication.
	 */
	public async addLabel(issueNumber: number, label: string): Promise<void> {
		Guard.isNullOrEmptyOrUndefined(this.repoName, "addLabel", "this.repoName");
		Guard.isLessThanOne(issueNumber, "addLabel", "issueNumber");
		Guard.isNullOrEmptyOrUndefined(label, "addLabel", "this.repoName");

		if (!this.containsToken()) {
			Utils.printAsGitHubError(`The request to add label '${label}' is forbidden.  Check the auth token.`);
			Deno.exit(1);
		}

		// First check that the label trying to be added exists in the repo
		const labelDoesNotExist = !(await this.labelClient.labelExists(label));

		if (labelDoesNotExist) {
			const labelsUrl = `https://github.com/KinsonDigital/${this.repoName}/labels`;
			const issueUrl = `https://github.com/KinsonDigital/${this.repoName}/issues/618`;

			let errorMsg = `The label '${label}' attempting to be added to issue '${issueNumber}'`;
			errorMsg += ` does not exist in the repository '${this.repoName}'.`;
			errorMsg += `\nRepo Labels: ${labelsUrl}`;
			errorMsg += `\nIssue: ${issueUrl}`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		const prLabels: string[] = await this.getLabels(issueNumber);
		prLabels.push(label);

		// REST API Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#update-an-issue
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${issueNumber}`;

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
					let errorMsg = `An error occurred trying to add the label '${label}' to issue '${issueNumber}'.`;
					errorMsg += `\n\tError: ${response.status}(${response.statusText})`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
				case GitHubHttpStatusCodes.NotFound:
					Utils.printAsGitHubError(`An issue with the number '${issueNumber}' does not exist.`);
					break;
			}

			Deno.exit(1);
		}
	}

	/**
	 * Gets all of the labels for an issue that matches the given {@link issueNumber} in a repository
	 * with a name that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The number of an issue.
	 * @returns The labels for an issue.
	 * @remarks Does not require authentication.
	 */
	public async getLabels(issueNumber: number): Promise<string[]> {
		Guard.isNullOrEmptyOrUndefined(this.repoName, "getLabels", "this.repoName");
		Guard.isLessThanOne(issueNumber, "getLabels", "issueNumber");

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${issueNumber}/labels`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status != GitHubHttpStatusCodes.OK) {
			switch (response.status) {
				case GitHubHttpStatusCodes.MovedPermanently:
				case GitHubHttpStatusCodes.Gone:
				case GitHubHttpStatusCodes.Unauthorized: {
					let errorMsg = `There was an issue getting the labels for issue '${issueNumber}'.`;
					errorMsg += `\n\tError: ${response.status}(${response.statusText})`;
					Utils.printAsGitHubError(errorMsg);
					break;
				}
				case GitHubHttpStatusCodes.NotFound:
					Utils.printAsGitHubError(`An issue with the number '${issueNumber}' does not exist.`);
					break;
			}

			Deno.exit(1);
		}

		const responseData = <LabelModel[]> await this.getResponseData(response);

		return responseData.map((label: LabelModel) => label.name);
	}

	/**
	 * Returns a value indicating whether or not an issue with the given {@link issueNumber} exists regardless
	 * of its state, in a repository with a name that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The issue number.
	 * @returns True if the issue exists, otherwise false.
	 */
	public async issueExists(issueNumber: number): Promise<boolean> {
		Guard.isLessThanOne(issueNumber, "openIssueExist", "issueNumber");

		return await this.openOrClosedIssueExists(issueNumber, IssueOrPRState.any);
	}

	/**
	 * Returns a value indicating whether or not an open issue with the given {@link issueNumber} exists in a
	 * repository with a name that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The issue number.
	 * @returns True if the issue exists and is open, otherwise false.
	 */
	public async openIssueExists(issueNumber: number): Promise<boolean> {
		Guard.isLessThanOne(issueNumber, "openIssueExist", "issueNumber");

		return await this.openOrClosedIssueExists(issueNumber, IssueOrPRState.open);
	}

	/**
	 * Returns a value indicating whether or not a closed issue with the given {@link issueNumber} exists in a
	 * repository with a name that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The issue number.
	 * @returns True if the issue exists and is open, otherwise false.
	 */
	public async closedIssueExists(issueNumber: number): Promise<boolean> {
		Guard.isLessThanOne(issueNumber, "closedIssueExist", "issueNumber");

		return await this.openOrClosedIssueExists(issueNumber, IssueOrPRState.closed);
	}

	/**
	 * Updates an issue with the given {@link issueNumber} and {@link issueData}, in a repository with a name
	 * that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The issue number.
	 * @param issueData The data to update the issue with.
	 */
	public async updateIssue(issueNumber: number, issueData: IssueOrPRRequestData): Promise<void> {
		Guard.isNullOrEmptyOrUndefined(this.repoName, "updateIssue", "this.repoName");
		Guard.isLessThanOne(issueNumber, "updateIssue", "issueNumber");

		this.repoName = this.repoName.trim();

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/issues/${issueNumber}`;

		const issueBody: string = JSON.stringify(issueData);
		const response = await this.requestPATCH(url, issueBody);

		if (response.status != GitHubHttpStatusCodes.OK) {
			if (response.status === GitHubHttpStatusCodes.NotFound) {
				Utils.printAsGitHubError(`An issue with the number '${issueNumber}' does not exist.`);
			} else {
				switch (response.status) {
					case GitHubHttpStatusCodes.MovedPermanently:
					case GitHubHttpStatusCodes.Gone:
					case GitHubHttpStatusCodes.UnprocessableContent:
					case GitHubHttpStatusCodes.ServiceUnavailable:
					case GitHubHttpStatusCodes.Unauthorized:
					case GitHubHttpStatusCodes.Forbidden: {
						let errorMsg = `An error occurred trying to update issue '${issueNumber}'.`;
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
	 * Checks if an issue with the given {@link issueNumber } exists with the given {@link state} in a
	 * repository with a name that matches the given {@link IssueClient}.{@link this.repoName}.
	 * @param issueNumber The number of the issue.
	 * @returns True if the issue exists, otherwise false.
	 */
	private async openOrClosedIssueExists(issueNumber: number, state: IssueOrPRState): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(this.repoName, "openOrClosedIssueExists", "this.repoName");
		Guard.isLessThanOne(issueNumber, "openOrClosedIssueExists", "issueNumber");

		this.repoName = this.repoName.toLowerCase();

		const issues = await this.getAllDataUntil<IssueModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getIssues(page, qtyPerPage, state);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: IssueModel[]) => {
				return pageOfData.some((issue: IssueModel) => issue.number === issueNumber);
			},
		);

		return issues.find((issue: IssueModel) => issue.number === issueNumber) != undefined;
	}
}
